import {
  useAccount,
  useClient,
  useEstimateGas,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CONTRACTS } from "./utils";
import { Address, maxUint256, parseEther } from "viem";
import { useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { waitForTransactionReceipt } from "viem/actions";

export type UseCreateProjectProps = {};

export type UseCreateProjectResult = {
  create: (data: { imageURI: string; title: string }) => Promise<string>;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
};

export function useCreateProject({}: UseCreateProjectProps): UseCreateProjectResult {
  const {
    writeContractAsync,
    data: hash,
    error,
    isPending,
  } = useWriteContract();
  const client = useClient();

  const create = async ({
    imageURI,
    title,
  }: {
    imageURI: string;
    title: string;
  }): Promise<string> => {
    try {
      const txResponse = await writeContractAsync({
        ...CONTRACTS.ProjectFactory,
        functionName: "createProject",
        args: [title, imageURI],
        value: parseEther("0.5") //parseEther("0.5"),
      });
      const receipt = await waitForTransactionReceipt(client!, {
        hash: txResponse,
      });
      console.log("receipt", receipt);
      const event = receipt.logs[0];
      const address = event.address;
      return address;
    } catch (error: any) {
      console.error("Creating Project error: ", error);
      toast.error(error.shortMessage);
      return "";
    }
  };

  const {
    isSuccess,
    isLoading,
    data,
    error: waitError,
  } = useWaitForTransactionReceipt({
    hash: hash,
  });

  useEffect(() => {
    if (waitError || error) {
      console.log({ waitError, error });
      toast.error(((waitError || error) as any).shortMessage);
    }
  }, [isSuccess, waitError]);

  return {
    create,
    isLoading,
    isSuccess,
    error,
  };
}
