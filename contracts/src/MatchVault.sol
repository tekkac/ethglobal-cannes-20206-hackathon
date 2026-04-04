// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract MatchVault {
    enum MatchStatus {
        Draft,
        AwaitingDeposits,
        Resolved,
        Cancelled
    }

    enum FinalAction {
        Split,
        Steal
    }

    struct MatchData {
        address playerA;
        address playerB;
        uint256 stakeAmount;
        bool playerADeposited;
        bool playerBDeposited;
        MatchStatus status;
        FinalAction finalActionA;
        FinalAction finalActionB;
        bool claimedA;
        bool claimedB;
    }

    IERC20 public immutable usdc;
    address public immutable resolver;

    mapping(bytes32 => MatchData) public matches;

    error Unauthorized();
    error MatchExists();
    error InvalidPlayer();
    error InvalidStatus();
    error AlreadyDeposited();
    error TransferFailed();
    error NothingToClaim();

    constructor(address usdcAddress, address resolverAddress) {
        usdc = IERC20(usdcAddress);
        resolver = resolverAddress;
    }

    function createMatch(bytes32 matchId, address playerA, address playerB, uint256 stakeAmount) external {
        if (msg.sender != resolver) revert Unauthorized();
        if (matches[matchId].playerA != address(0)) revert MatchExists();
        if (playerA == address(0) || playerB == address(0) || playerA == playerB) revert InvalidPlayer();

        matches[matchId] = MatchData({
            playerA: playerA,
            playerB: playerB,
            stakeAmount: stakeAmount,
            playerADeposited: false,
            playerBDeposited: false,
            status: MatchStatus.AwaitingDeposits,
            finalActionA: FinalAction.Split,
            finalActionB: FinalAction.Split,
            claimedA: false,
            claimedB: false
        });
    }

    function depositStake(bytes32 matchId) external {
        MatchData storage matchData = matches[matchId];
        if (matchData.status != MatchStatus.AwaitingDeposits) revert InvalidStatus();

        if (msg.sender == matchData.playerA) {
            if (matchData.playerADeposited) revert AlreadyDeposited();
            matchData.playerADeposited = true;
        } else if (msg.sender == matchData.playerB) {
            if (matchData.playerBDeposited) revert AlreadyDeposited();
            matchData.playerBDeposited = true;
        } else {
            revert InvalidPlayer();
        }

        if (!usdc.transferFrom(msg.sender, address(this), matchData.stakeAmount)) {
            revert TransferFailed();
        }
    }

    function resolveMatch(bytes32 matchId, FinalAction finalActionA, FinalAction finalActionB) external {
        if (msg.sender != resolver) revert Unauthorized();

        MatchData storage matchData = matches[matchId];
        if (matchData.status != MatchStatus.AwaitingDeposits) revert InvalidStatus();
        if (!matchData.playerADeposited || !matchData.playerBDeposited) revert InvalidStatus();

        matchData.finalActionA = finalActionA;
        matchData.finalActionB = finalActionB;
        matchData.status = MatchStatus.Resolved;
    }

    function cancelMatch(bytes32 matchId) external {
        if (msg.sender != resolver) revert Unauthorized();

        MatchData storage matchData = matches[matchId];
        if (matchData.status != MatchStatus.AwaitingDeposits) revert InvalidStatus();
        matchData.status = MatchStatus.Cancelled;
    }

    function claim(bytes32 matchId) external {
        MatchData storage matchData = matches[matchId];

        if (matchData.status == MatchStatus.Cancelled) {
            _claimCancelled(matchData);
            return;
        }

        if (matchData.status != MatchStatus.Resolved) revert InvalidStatus();

        uint256 payout = _payoutFor(matchData, msg.sender);
        if (payout == 0) revert NothingToClaim();

        if (msg.sender == matchData.playerA) {
            matchData.claimedA = true;
        } else if (msg.sender == matchData.playerB) {
            matchData.claimedB = true;
        }

        if (!usdc.transfer(msg.sender, payout)) revert TransferFailed();
    }

    function _claimCancelled(MatchData storage matchData) internal {
        if (msg.sender == matchData.playerA && matchData.playerADeposited && !matchData.claimedA) {
            matchData.claimedA = true;
            if (!usdc.transfer(msg.sender, matchData.stakeAmount)) revert TransferFailed();
            return;
        }

        if (msg.sender == matchData.playerB && matchData.playerBDeposited && !matchData.claimedB) {
            matchData.claimedB = true;
            if (!usdc.transfer(msg.sender, matchData.stakeAmount)) revert TransferFailed();
            return;
        }

        revert NothingToClaim();
    }

    function _payoutFor(MatchData storage matchData, address player) internal view returns (uint256) {
        bool isPlayerA = player == matchData.playerA;
        bool isPlayerB = player == matchData.playerB;

        if (!isPlayerA && !isPlayerB) revert InvalidPlayer();
        if ((isPlayerA && matchData.claimedA) || (isPlayerB && matchData.claimedB)) {
            return 0;
        }

        if (matchData.finalActionA == FinalAction.Split && matchData.finalActionB == FinalAction.Split) {
            return matchData.stakeAmount;
        }

        if (matchData.finalActionA == FinalAction.Steal && matchData.finalActionB == FinalAction.Split) {
            return isPlayerA ? matchData.stakeAmount * 2 : 0;
        }

        if (matchData.finalActionA == FinalAction.Split && matchData.finalActionB == FinalAction.Steal) {
            return isPlayerB ? matchData.stakeAmount * 2 : 0;
        }

        return 0;
    }
}
