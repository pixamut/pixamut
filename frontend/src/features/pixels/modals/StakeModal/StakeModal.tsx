import { selectPixelById } from "$features/pixels/pixel.slice";
import { useAppSelector } from "$store/hooks";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import { arrowBackSharp, saveSharp, sendSharp } from "ionicons/icons";

import "./StakeModal.scss";
import { memo, useEffect, useRef, useState } from "react";
import Tooltip from "$features/shared/Tooltip/Tooltip";
import ActivityChart from "$features/pixels/map/PixelDetails/ActivityChart/ActivityChart";
import { ResponsiveContainer } from "recharts";
import StakeAmountPopover from "../StakeAmountPopover/StakeAmountPopover";
import ColorPickerPopover from "../ColorPickerPopover/ColorPickerPopover";
import { colorToString } from "$features/shared/utils";
import { useStakePixel } from "$features/shared/hooks/useStakePixel";
import StakeButton from "./StakeButton";
import { usePXMTBalance } from "$features/shared/hooks/usePXMTBalance";
type Props = {
  pixelId: number;
};
const StakeModal: React.FC<Props> = ({ pixelId }) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const pixel = useAppSelector((state) => selectPixelById(state, pixelId));

  const [color, setColor] = useState<number>(pixel?.color ?? 0x000000);
  const [amount, setAmount] = useState<number>(0);

  const balance = usePXMTBalance();

  useEffect(() => {
    setColor(pixel?.color ?? 0x000000);
    setAmount((pixel?.stakeAmount ?? 0) + 0.000000000000000001);
  }, [pixel]);

  function closeModal() {
    modal.current?.dismiss();
  }

  return (
    <IonModal
      ref={modal}
      className="stake-modal-page"
      trigger="open-stake-modal"
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="primary" title="Close" onClick={closeModal}>
              <IonIcon icon={arrowBackSharp} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            <div className="modal-title">
              <div className="pixel-name">
                pixel#
                <span>{pixel?.id}</span>
              </div>
              <div className="pixel-coords">
                ({pixel?.x},{pixel?.y})
              </div>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="stake-modal-container">
          <div className="current-pixel">
            {pixelId && <ActivityChart pixelId={pixelId} isDetailed={true} />}
          </div>
          <div className="stake-inputs">
            <div className="stake-input color">
              <IonLabel className="input-label">
                <div className="input-label-title">color</div>
                <Tooltip text="" />
                <div>:</div>
              </IonLabel>
              <IonButton
                className="input-button"
                fill="clear"
                id="stake-color-input"
              >
                <div
                  className="color-block"
                  style={{ backgroundColor: colorToString(color) }}
                ></div>
                <IonLabel>{colorToString(color)}</IonLabel>
              </IonButton>
              <ColorPickerPopover color={color} onColorChange={setColor} />
            </div>
            <div className="stake-input">
              <IonLabel className="input-label">
                <div className="input-label-title">amount</div>
                <Tooltip text="" />
                <div>:</div>
              </IonLabel>
              <IonButton
                className="input-button"
                fill="clear"
                id="stake-amount-input"
              >
                <IonLabel>
                  {amount} PXMT <span>({balance} PXMT)</span>
                </IonLabel>
              </IonButton>
              <StakeAmountPopover
                onStakeAmountSet={setAmount}
                trigger="stake-amount-input"
                defaultValue={amount}
              />
            </div>
          </div>
          <StakeButton
            amount={amount}
            color={color}
            pixelId={pixelId}
            balance={balance}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default memo(StakeModal);
