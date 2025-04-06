import { usePXMTBalance } from "$features/shared/hooks/usePXMTBalance";
import { useStakePixel } from "$features/shared/hooks/useStakePixel";
import { IonButton, IonIcon, IonLabel, IonSpinner } from "@ionic/react";
import { alertSharp, sendSharp } from "ionicons/icons";

type Props = {
  pixelId: number;
  amount: number;
  color: number;
  balance: number;
};
const StakeButton: React.FC<Props> = ({ pixelId, amount, color, balance }) => {
  const { stake, approve, isLoading, isSuccess, error, needsApproval } =
    useStakePixel({
      pixelId,
      amount: amount.toFixed(18),
      color,
    });

  async function handleStake() {
    if (needsApproval) {
      await approve();
    } else {
      await stake();
    }
  }

  return (
    <IonButton
      color="primary"
      expand="full"
      onClick={handleStake}
      disabled={balance < amount}
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
          <IonLabel>{needsApproval ? "approve" : "stake"}</IonLabel>
        </>
      )}
    </IonButton>
  );
};

export default StakeButton;
