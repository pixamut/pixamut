import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonModal,
  IonTitle,
} from "@ionic/react";
import { useRef, useState } from "react";

import "./NamePopover.scss";
type Props = {
  trigger: string;
  onNameSet: (name: string) => void;
  defaultValue?: string | undefined;
};
const NamePopover: React.FC<Props> = ({
  onNameSet,
  defaultValue,
  trigger,
}) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  function onWillPresent() {
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 100);
  }

  function closeModal() {
    modal.current?.dismiss();
  }
  function confirmModal() {
    console.log('confirmModal', {current: inputRef.current, value: inputRef.current?.value});
    onNameSet(String(inputRef.current?.value as string ?? ""));
    closeModal();
  }

  return (
    <IonModal
      ref={modal}
      className="alert-modal"
      trigger={trigger}
      onWillPresent={onWillPresent}
    >
      <IonTitle>Image name</IonTitle>
      <IonContent className="alert-modal-content">
        <div className="stake-name-popover-container">
          <div className="content">
            <IonInput
              ref={inputRef}
              type="text"
              value={defaultValue ?? 0}
            />
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

export default NamePopover;
