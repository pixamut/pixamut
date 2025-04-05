import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonModal,
  IonTitle,
} from "@ionic/react";
import { useRef, useState } from "react";

import "./ColorPickerPopover.scss";
import { colorToString, stringToColor } from "$features/shared/utils";
import { HexColorInput, HexColorPicker } from "react-colorful";
type Props = {
  onColorChange: (color: number) => void;
  color: number;
};
const ColorPickerPopover: React.FC<Props> = ({ color, onColorChange }) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  const [newColor, setNewColor] = useState<string>(colorToString(color));

  function onWillPresent() {
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 100);
  }

  function closeModal() {
    modal.current?.dismiss();
  }

  function confirmModal() {
    let value = (inputRef.current?.value as string)?.trim() || "#000000";
    if (value[0] != "#") value = "#" + value;
    onColorChange(stringToColor(value));
    closeModal();
  }

  function setMax() {
    onWillPresent();
  }

  return (
    <IonModal
      ref={modal}
      className="alert-modal color"
      trigger="stake-color-input"
      onWillPresent={onWillPresent}
    >
      <IonTitle>amount to stake</IonTitle>
      <IonContent className="alert-modal-content">
        <div className="stake-color-popover-container">
          <div className="content">
            <HexColorPicker color={newColor} onChange={setNewColor} />
            <IonInput
              ref={inputRef}
              type="text"
              value={newColor}
              maxlength={7}
              pattern="^#[0-9A-Fa-f]{6}$"
              onInput={(e) => {
                if (
                  e.currentTarget.value &&
                  /^#[0-9A-Fa-f]{6}$/.test(e.currentTarget.value as string)
                ) {
                  setNewColor(e.currentTarget.value as string);
                }
              }}
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

export default ColorPickerPopover;
