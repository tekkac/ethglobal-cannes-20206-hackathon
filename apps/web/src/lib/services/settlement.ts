import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

import { MATCH_VAULT_ABI, MATCH_VAULT_ADDRESS, FinalAction as ContractAction } from "@/lib/contracts/match-vault";
import type { FinalAction } from "@agent-duel/shared";

const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY as Hex | undefined;

const chain = baseSepolia;
const transport = http(process.env.BASE_SEPOLIA_RPC_URL);

const publicClient = createPublicClient({ chain, transport });

function getResolverWallet() {
  if (!RESOLVER_PRIVATE_KEY) {
    return null;
  }
  const account = privateKeyToAccount(RESOLVER_PRIVATE_KEY);
  return createWalletClient({ account, chain, transport });
}

function toBytes32(matchId: string): Hex {
  // Pad the match ID (UUID without dashes) to 32 bytes
  const hex = matchId.replace(/-/g, "");
  return `0x${hex.padEnd(64, "0")}` as Hex;
}

function toContractAction(action: FinalAction): 0 | 1 {
  return action === "STEAL" ? ContractAction.Steal : ContractAction.Split;
}

/**
 * Called by the server after commit-reveal verification succeeds.
 * Sends a resolveMatch tx to the MatchVault contract.
 */
export async function resolveMatchOnChain(params: {
  matchId: string;
  finalActionA: FinalAction;
  finalActionB: FinalAction;
}): Promise<{ txHash: string } | { error: string }> {
  const wallet = getResolverWallet();
  if (!wallet) {
    return { error: "RESOLVER_PRIVATE_KEY not configured — on-chain settlement skipped" };
  }
  if (!MATCH_VAULT_ADDRESS) {
    return { error: "MATCH_VAULT_ADDRESS not configured — on-chain settlement skipped" };
  }

  const matchBytes = toBytes32(params.matchId);

  try {
    const txHash = await wallet.writeContract({
      address: MATCH_VAULT_ADDRESS,
      abi: MATCH_VAULT_ABI,
      functionName: "resolveMatch",
      args: [matchBytes, toContractAction(params.finalActionA), toContractAction(params.finalActionB)],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `On-chain resolve failed: ${message}` };
  }
}

/**
 * Called by the server when a match is cancelled before resolution.
 */
export async function cancelMatchOnChain(matchId: string): Promise<{ txHash: string } | { error: string }> {
  const wallet = getResolverWallet();
  if (!wallet || !MATCH_VAULT_ADDRESS) {
    return { error: "On-chain settlement not configured" };
  }

  try {
    const txHash = await wallet.writeContract({
      address: MATCH_VAULT_ADDRESS,
      abi: MATCH_VAULT_ABI,
      functionName: "cancelMatch",
      args: [toBytes32(matchId)],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return { txHash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `On-chain cancel failed: ${message}` };
  }
}

/**
 * Read on-chain match state (for verification/display).
 */
export async function getOnChainMatchState(matchId: string) {
  if (!MATCH_VAULT_ADDRESS) return null;

  try {
    const result = await publicClient.readContract({
      address: MATCH_VAULT_ADDRESS,
      abi: MATCH_VAULT_ABI,
      functionName: "matches",
      args: [toBytes32(matchId)],
    });

    const [playerA, playerB, stakeAmount, playerADeposited, playerBDeposited, status] = result;
    return { playerA, playerB, stakeAmount, playerADeposited, playerBDeposited, status };
  } catch {
    return null;
  }
}
