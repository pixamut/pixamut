import { createConfig, webSocket } from "@wagmi/core";
import { Chain } from "@wagmi/core/chains";
import { injected } from "@wagmi/connectors";

export const bahamutTestnet = {
  id: 2552,
  name: "Bahamut Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "FTN",
    symbol: "FTN",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc1-horizon.bahamut.io"],
      webSocket: ["wss://ws1-horizon.bahamut.io"],
    },
    public: {
      http: ["https://rpc1-horizon.bahamut.io"],
      webSocket: ["wss://ws1-horizon.bahamut.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Horizonscan",
      url: "https://horizon.ftnscan.com",
    },
  },
  contracts: {},
} as const satisfies Chain;

export const config = createConfig({
  chains: [bahamutTestnet /*etherlinkTestnet*/],
  connectors: [
    injected(),
    // coinbaseWallet({ appName: "Create Wagmi" }),
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  ssr: true,
  transports: {
    [bahamutTestnet.id]: webSocket(),
    // [etherlinkTestnet.id]: http(),
  },
});
