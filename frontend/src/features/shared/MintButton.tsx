import { IonButton, IonLabel } from "@ionic/react";
import { memo } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { CONTRACTS } from "./hooks/utils";
import { parseEther } from "viem";

const MintButton: React.FC = () => {
  const { address } = useAccount();

  const { writeContractAsync } = useWriteContract();

  async function click() {
    await writeContractAsync({
      ...CONTRACTS.Token,
      functionName: "mint",
      args: [address, parseEther("200")],
    });
  }
  return (
    <IonButton onClick={click}>
      <IonLabel>Mint IFYS</IonLabel>
    </IonButton>
  );
};

export default memo(MintButton);
