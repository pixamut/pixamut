import { ReactNode } from "react";
import { store } from "./store/store";
import { Provider } from "react-redux";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  );
}
