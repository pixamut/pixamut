import { useDepositIntoProject } from "$features/shared/hooks/useDepositIntoProject";
import { usePXMTBalance } from "$features/shared/hooks/usePXMTBalance";
import { useStakePixel } from "$features/shared/hooks/useStakePixel";
import { IonButton, IonIcon, IonLabel, IonSpinner } from "@ionic/react";
import { alertSharp, sendSharp } from "ionicons/icons";
import { Address } from "viem";

type Props = {
  amount: number;
  projectAddress: string;
};
const ProjectButton: React.FC<Props> = ({ projectAddress, amount }) => {
  const balance = usePXMTBalance();
  const { deposit, approve, isLoading, isSuccess, error, needsApproval } =
    useDepositIntoProject({
      projectAddress: projectAddress as Address,
      amount: amount.toFixed(18),
    });

  async function handleAction() {
    if (needsApproval) {
      await approve();
    } else {
      await deposit();
    }
  }

  return (
    <IonButton
      color="primary"
      expand="full"
      onClick={handleAction}
      disabled={balance < amount || amount == 0}
    >
      {isLoading ? (
        <IonSpinner name="circular" color="dark" />
      ) : balance < amount ? (
        <>
          <IonIcon slot="start" icon={alertSharp} />
          <IonLabel>not enough PXMT balance</IonLabel>
        </>
      ) : (
        <>
          <IonIcon slot="start" icon={sendSharp} />
          <IonLabel>{needsApproval ? "approve" : "deposit"}</IonLabel>
        </>
      )}
    </IonButton>
  );
};

export default ProjectButton;
