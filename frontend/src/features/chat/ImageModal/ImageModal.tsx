import {
  selectControlOfOwner,
  selectPixelById,
} from "$features/pixels/pixel.slice";
import { useAppSelector } from "$store/hooks";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from "@ionic/react";
import {
  arrowBackSharp,
  arrowForward,
  arrowForwardSharp,
  closeSharp,
  saveSharp,
  sendSharp,
} from "ionicons/icons";

import "./ImageModal.scss";
import { memo, useEffect, useRef, useState } from "react";
import Tooltip from "$features/shared/Tooltip/Tooltip";
import { shortenAddress } from "$features/shared/utils";
import { useIFYSBalance } from "$features/shared/hooks/useIFYSBalance";
import { selectProjectByAddress } from "$features/projects/project.slice";
import ProjectMap from "$features/projects/ProjectMap/ProjectMap";
import StakeAmountPopover from "$features/pixels/modals/StakeAmountPopover/StakeAmountPopover";
type Props = {
  onDidDismiss: (data: {
    width: number;
    height: number;
    imgSrc: string | undefined;
  }) => void;
  isOpen: boolean;
};
const ImageModal: React.FC<Props> = ({ isOpen, onDidDismiss }) => {
  const modal = useRef<HTMLIonModalElement>(null);

  const [width, setWidth] = useState<number>(30);
  const [height, setHeight] = useState<number>(30);
  const [ratio, setRatio] = useState<number>(1);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [originalImgSrc, setOriginalImgSrc] = useState<string | undefined>(
    undefined,
  );
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  async function updateWidth(newWidth: number) {
    if (newWidth > 100) return;
    const h = newWidth;
    const w = Math.round(newWidth / ratio);
    if (originalImgSrc) {
      const res = await processImage(originalImgSrc, w, h);
      setImgSrc(res);
    }
  }
  async function updateHeight(newHeight: number) {
    if (newHeight > 100) return;
    const h = newHeight;
    const w = Math.round(newHeight * ratio);
    if (originalImgSrc) {
      const res = await processImage(originalImgSrc, w, h);
      setImgSrc(res);
    }
  }
  function updateImage(dataUrl: string | undefined) {
    console.log("updating image");
    if (!dataUrl) {
      setOriginalImgSrc(undefined);
      setImgSrc(undefined);
    } else {
      console.log("got image");
      setOriginalImgSrc(dataUrl);
      processImage(dataUrl, width, height).then((res: string) => {
        setImgSrc(res);
      });
    }
  }

  async function processImage(
    dataUrl: string,
    w: number,
    h: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let offCanvas = offscreenCanvasRef.current;
        if (!offCanvas) {
          offCanvas = document.createElement("canvas");
          offscreenCanvasRef.current = offCanvas;
        }
        const originalW = img.width;
        const originalH = img.height;
        offCanvas.width = originalW;
        offCanvas.height = originalH;
        const offCtx = offCanvas.getContext("2d");
        if (!offCtx) return reject("Could not create 2D context");

        const ratio = originalW / originalH;
        offCtx.drawImage(img, 0, 0);

        let targetW = w;
        let targetH = Math.round(targetW / ratio);

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = targetW;
        resizeCanvas.height = targetH;
        const resizeCtx = resizeCanvas.getContext("2d");
        if (!resizeCtx) return reject("Could not create 2D context (resize)");

        resizeCtx.imageSmoothingEnabled = false;
        resizeCtx.imageSmoothingQuality = "low";

        resizeCtx.drawImage(
          offCanvas,
          0,
          0,
          originalW,
          originalH,
          0,
          0,
          targetW,
          targetH,
        );
        const imageData = resizeCtx.getImageData(0, 0, targetW, targetH);

        // floydSteinbergDither(imageData, targetW, targetH, 8, 0);

        resizeCtx.putImageData(imageData, 0, 0);

        const outputDataUrl = resizeCanvas.toDataURL("image/png");
        setRatio(ratio);
        setHeight(targetH);
        setWidth(targetW);
        resolve(outputDataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = dataUrl;
    });
  }

  function closeModal() {
    modal.current?.dismiss();
  }

  return (
    <IonModal
      ref={modal}
      className={`image-modal-page ${imgSrc ? "has-image" : ""}`}
      isOpen={isOpen}
      onDidDismiss={() => onDidDismiss({ width, height, imgSrc })}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton color="primary" title="Close" onClick={closeModal}>
              <IonIcon icon={closeSharp} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            <div className="modal-title">upload image</div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="image-modal-container">
          <div className="image-upload-container">
            <div className="upload-button-container">
              {!imgSrc && (
                <IonButton
                  className="upload-button"
                  fill="clear"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <IonLabel>choose image</IonLabel>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          updateImage(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </IonButton>
              )}
              {imgSrc && (
                <div className="image-preview">
                  <img src={imgSrc} alt="Preview" />
                  <IonButton
                    className="remove-image"
                    fill="clear"
                    onClick={() => updateImage(undefined)}
                  >
                    <IonLabel>remove image</IonLabel>
                  </IonButton>
                </div>
              )}
            </div>
          </div>
          <div className="image-inputs">
            <div className="image-input">
              <IonLabel className="input-label">
                <div className="input-label-title">width</div>
                <Tooltip text="" />
                <div>:</div>
              </IonLabel>
              <IonButton
                className="input-button"
                fill="clear"
                id="image-width-input"
              >
                <IonLabel>
                  {width}
                  <span>px</span>
                </IonLabel>
              </IonButton>
              <StakeAmountPopover
                onStakeAmountSet={updateWidth}
                trigger="image-width-input"
                max={100}
                min={1}
                defaultValue={width}
              />
            </div>
            <div className="image-input">
              <IonLabel className="input-label">
                <div className="input-label-title">height</div>
                <Tooltip text="" />
                <div>:</div>
              </IonLabel>
              <IonButton
                className="input-button"
                fill="clear"
                id="image-height-input"
              >
                <IonLabel>
                  {height}
                  <span>px</span>
                </IonLabel>
              </IonButton>
              <StakeAmountPopover
                onStakeAmountSet={updateHeight}
                trigger="image-height-input"
                max={100}
                min={1}
                defaultValue={height}
              />
            </div>
          </div>
          <IonButton disabled={!imgSrc} onClick={closeModal}>
            <IonLabel>upload</IonLabel>
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default memo(ImageModal);
