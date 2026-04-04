// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";

import {MatchVault, IERC20} from "../src/MatchVault.sol";

contract MockUSDC is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 value) external {
        balanceOf[to] += value;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "balance");
        require(allowance[from][msg.sender] >= value, "allowance");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
}

contract MatchVaultTest is Test {
    MockUSDC internal usdc;
    MatchVault internal vault;

    address internal resolver = address(0xBEEF);
    address internal playerA = address(0xA11CE);
    address internal playerB = address(0xB0B);

    bytes32 internal matchId = keccak256("match-1");
    uint256 internal constant STAKE = 5e6;

    function setUp() public {
        usdc = new MockUSDC();
        vault = new MatchVault(address(usdc), resolver);

        usdc.mint(playerA, STAKE);
        usdc.mint(playerB, STAKE);

        vm.prank(resolver);
        vault.createMatch(matchId, playerA, playerB, STAKE);

        vm.prank(playerA);
        usdc.approve(address(vault), STAKE);

        vm.prank(playerB);
        usdc.approve(address(vault), STAKE);
    }

    function testSplitSplitReturnsOriginalStake() public {
        _depositBoth();

        vm.prank(resolver);
        vault.resolveMatch(matchId, MatchVault.FinalAction.Split, MatchVault.FinalAction.Split);

        vm.prank(playerA);
        vault.claim(matchId);

        vm.prank(playerB);
        vault.claim(matchId);

        assertEq(usdc.balanceOf(playerA), STAKE);
        assertEq(usdc.balanceOf(playerB), STAKE);
    }

    function testStealSplitPaysWinner() public {
        _depositBoth();

        vm.prank(resolver);
        vault.resolveMatch(matchId, MatchVault.FinalAction.Steal, MatchVault.FinalAction.Split);

        vm.prank(playerA);
        vault.claim(matchId);

        assertEq(usdc.balanceOf(playerA), STAKE * 2);
        assertEq(usdc.balanceOf(playerB), 0);
    }

    function testCancelledMatchRefundsDeposits() public {
        _depositBoth();

        vm.prank(resolver);
        vault.cancelMatch(matchId);

        vm.prank(playerA);
        vault.claim(matchId);

        vm.prank(playerB);
        vault.claim(matchId);

        assertEq(usdc.balanceOf(playerA), STAKE);
        assertEq(usdc.balanceOf(playerB), STAKE);
    }

    function _depositBoth() internal {
        vm.prank(playerA);
        vault.depositStake(matchId);

        vm.prank(playerB);
        vault.depositStake(matchId);
    }
}
