import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonModal,
  IonTitle,
} from "@ionic/react";
import { useRef, useState } from "react";

import "./StakeAmountPopover.scss";
import { usePXMTBalance } from "$features/shared/hooks/usePXMTBalance";
type Props = {
  trigger: string;
  onStakeAmountSet: (amount: number) => void;
  defaultValue?: number | undefined;
  max?: number | undefined;
  min?: number | undefined;
};
const StakeAmountPopover: React.FC<Props> = ({
  onStakeAmountSet,
  defaultValue,
  trigger,
  max,
  min,
}) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  const balance = usePXMTBalance();

  function onWillPresent() {
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 100);
  }

  function closeModal() {
    modal.current?.dismiss();
  }

  function confirmModal() {
    onStakeAmountSet(Number(inputRef.current?.value ?? 0));
    closeModal();
  }

  function setMax() {
    inputRef.current!.value = balance;
    onWillPresent();
  }

  return (
    <IonModal
      ref={modal}
      className="alert-modal"
      trigger={trigger}
      onWillPresent={onWillPresent}
    >
      <IonTitle>amount to stake</IonTitle>
      <IonContent className="alert-modal-content">
        <div className="stake-amount-popover-container">
          <div className="content">
            <IonInput
              ref={inputRef}
              type="number"
              value={defaultValue ?? 0}
              max={max}
              min={min || 0}
            />
            <div className="hint">
              <div className="amount">{balance} PXMT</div>
              <IonButton fill="clear" onClick={setMax}>
                <IonLabel>max</IonLabel>
              </IonButton>
            </div>
          </div>

          <div className="actions">
            <IonButton fill="clear" color="medium" onClick={closeModal}>
              <IonLabel>cancel</IonLabel>
            </IonButton>
            <IonButton fill="clear" onClick={confirmModal}>
              <IonLabel>ok</IonLabel>
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default StakeAmountPopover;
