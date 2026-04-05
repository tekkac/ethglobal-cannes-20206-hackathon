import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Agent Duel Arena",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "DEMO_PROJECT_ID",
  chains: [base, baseSepolia],
  ssr: true,
});
