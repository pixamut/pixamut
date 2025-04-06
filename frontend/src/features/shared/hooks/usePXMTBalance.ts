import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "./utils";
import { formatEther } from "viem";

export function usePXMTBalance() {
  const { address: account } = useAccount();
  const { data: balance } = useReadContract({
    ...CONTRACTS.Token,
    functionName: "balanceOf",
    args: [account],
  }) as { data: bigint | undefined };

  return balance ? Number(formatEther(balance)) : 0;
}
