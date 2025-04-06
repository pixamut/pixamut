import { IonButton, IonChip, IonLabel, IonSpinner } from "@ionic/react";
import { memo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { CONTRACTS } from "./hooks/utils";
import { parseEther } from "viem";
import { usePXMTBalance } from "./hooks/usePXMTBalance";

const MintButton: React.FC = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const balance = usePXMTBalance();

  const { writeContractAsync } = useWriteContract();

  async function click() {
    setIsLoading(true);
    try {
      await writeContractAsync({
        ...CONTRACTS.Token,
        functionName: "mint",
        args: [address, parseEther("200")],
      });
      setIsLoading(false);
      
    } catch (error) {
      setIsLoading(false);
      
    }
  }
  return (
    <>
      {isLoading ? (
        <IonSpinner name="circular" color="dark" />
      ) : (
        <IonButton color="primary" onClick={click}>
          <IonLabel>Mint PXMT</IonLabel>

          <IonChip color="primary">
            <IonLabel>{balance}</IonLabel>
          </IonChip>
        </IonButton>
      )}
    </>
  );
};

export default memo(MintButton);
