import { useEffect, useMemo, useState } from "react";
import { Address, maxUint256, parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACTS } from "./utils";
import { toast } from "react-toastify";
import ProjectABI from "$abis/Project.json";

type UseDepositIntoProjectProps = {
  projectAddress: Address | undefined;
  amount: string;
};

type UseDepositIntoProjectResult = {
  deposit: () => Promise<void>;
  approve: () => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  needsApproval: boolean;
};

export function useDepositIntoProject({
  projectAddress,
  amount,
}: UseDepositIntoProjectProps): UseDepositIntoProjectResult {
  const { address: account } = useAccount();
  const {
    writeContractAsync,
    data: hash,
    error,
    isPending,
  } = useWriteContract();

  const { data: allowance, refetch } = useReadContract({
    ...CONTRACTS.Token,
    functionName: "allowance",
    args: [account, projectAddress],
  });

  const needsApproval = useMemo(() => {
    if (allowance == undefined) {
      console.log("needsApproval is tru because allowance undefined");
      return true;
    }
    console.log("needsApproval:", allowance, amount);
    return (allowance as bigint) < parseEther(amount);
  }, [allowance, amount]);

  const approve = async () => {
    try {
      await writeContractAsync({
        ...CONTRACTS.Token,
        functionName: "approve",
        args: [projectAddress, maxUint256],
      });
      await refetch();
    } catch (error: any) {
      console.error("Approval error: ", error);
      toast.error(error.shortMessage);
    }
  };

  const deposit = async () => {
    if (projectAddress) {
      try {
        await writeContractAsync({
          address: projectAddress,
          abi: ProjectABI.abi,
          functionName: "deposit",
          args: [parseEther(amount)],
        });
      } catch (error: any) {
        console.error("Staking error: ", error);
        toast.error(error.shortMessage);
      }
    }
  };

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: hash,
  });

  // useEffect(() => {
  //   setIsProcessing(isLoading || isPending);
  // }, [isLoading, isPending]);

  return {
    deposit,
    approve,
    isLoading,
    isSuccess,
    error,
    needsApproval,
  };
}
