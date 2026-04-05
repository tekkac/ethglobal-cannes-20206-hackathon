import { getContract, type Address, type PublicClient, type WalletClient } from "viem";

export const MATCH_VAULT_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "usdcAddress", type: "address" },
      { name: "resolverAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createMatch",
    inputs: [
      { name: "matchId", type: "bytes32" },
      { name: "playerA", type: "address" },
      { name: "playerB", type: "address" },
      { name: "stakeAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "depositStake",
    inputs: [{ name: "matchId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveMatch",
    inputs: [
      { name: "matchId", type: "bytes32" },
      { name: "finalActionA", type: "uint8" },
      { name: "finalActionB", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelMatch",
    inputs: [{ name: "matchId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "matchId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "matches",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "playerA", type: "address" },
      { name: "playerB", type: "address" },
      { name: "stakeAmount", type: "uint256" },
      { name: "playerADeposited", type: "bool" },
      { name: "playerBDeposited", type: "bool" },
      { name: "status", type: "uint8" },
      { name: "finalActionA", type: "uint8" },
      { name: "finalActionB", type: "uint8" },
      { name: "claimedA", type: "bool" },
      { name: "claimedB", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolver",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdc",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  { type: "error", name: "AlreadyDeposited", inputs: [] },
  { type: "error", name: "InvalidPlayer", inputs: [] },
  { type: "error", name: "InvalidStatus", inputs: [] },
  { type: "error", name: "MatchExists", inputs: [] },
  { type: "error", name: "NothingToClaim", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "Unauthorized", inputs: [] },
] as const;

// Standard ERC-20 approve ABI (needed for depositStake)
export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export const MATCH_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_MATCH_VAULT_ADDRESS ?? "") as Address;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as Address;

// Contract enum values matching Solidity
export const FinalAction = { Split: 0, Steal: 1 } as const;
export const MatchStatus = { Draft: 0, AwaitingDeposits: 1, Resolved: 2, Cancelled: 3 } as const;

export function getMatchVaultContract(client: PublicClient | WalletClient) {
  return getContract({
    address: MATCH_VAULT_ADDRESS,
    abi: MATCH_VAULT_ABI,
    client,
  });
}
