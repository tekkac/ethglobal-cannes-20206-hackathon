import { connectorsForWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: "Agent Duel Arena",
      projectId,
      chains: [base, baseSepolia],
      ssr: true,
    })
  : createConfig({
      chains: [base, baseSepolia],
      connectors: connectorsForWallets(
        [{ groupName: "Wallets", wallets: [injectedWallet, metaMaskWallet, coinbaseWallet] }],
        { appName: "Agent Duel Arena", projectId: "none" },
      ),
      transports: { [base.id]: http(), [baseSepolia.id]: http() },
      ssr: true,
    });
