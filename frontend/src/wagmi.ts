import { http, createConfig, webSocket } from "@wagmi/core";
import { foundry } from "@wagmi/core/chains";
import { injected } from "@wagmi/connectors";

export const config = createConfig({
  chains: [foundry /*etherlinkTestnet*/],
  connectors: [
    injected(),
    // coinbaseWallet({ appName: "Create Wagmi" }),
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  ssr: true,
  transports: {
    [foundry.id]: webSocket(),
    // [etherlinkTestnet.id]: http(),
  },
});
