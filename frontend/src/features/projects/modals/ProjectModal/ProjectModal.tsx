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
  saveSharp,
  sendSharp,
} from "ionicons/icons";

import "./ProjectModal.scss";
import { memo, useEffect, useRef, useState } from "react";
import Tooltip from "$features/shared/Tooltip/Tooltip";
import ActivityChart from "$features/pixels/map/PixelDetails/ActivityChart/ActivityChart";
import { ResponsiveContainer } from "recharts";
import { colorToString, shortenAddress } from "$features/shared/utils";
import { useStakePixel } from "$features/shared/hooks/useStakePixel";
import { usePXMTBalance } from "$features/shared/hooks/usePXMTBalance";
import ProjectButton from "./ProjectButton";
import { selectProjectByAddress } from "$features/projects/project.slice";
import ProjectMap from "$features/projects/ProjectMap/ProjectMap";
import StakeAmountPopover from "$features/pixels/modals/StakeAmountPopover/StakeAmountPopover";
type Props = {
  onDidDismiss: () => void;
  isOpen: boolean;
  projectAddress: string;
};
const ProjectModal: React.FC<Props> = ({
  projectAddress,
  isOpen,
  onDidDismiss,
}) => {
  const modal = useRef<HTMLIonModalElement>(null);
  const project = useAppSelector((state) =>
    selectProjectByAddress(state, projectAddress),
  );
  const controls = useAppSelector((state) =>
    selectControlOfOwner(state, projectAddress),
  );

  const [amount, setAmount] = useState<number>(0);

  const balance = usePXMTBalance();

  function closeModal() {
    modal.current?.dismiss();
  }

  return (
    <IonModal
      ref={modal}
      className="project-modal-page"
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
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
                project#
                <span>{shortenAddress(projectAddress, 6)}</span>
              </div>
              <div className="pixel-coords"></div>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {project && (
          <div className="project-modal-container">
            <div className="map-container">
              <IonImg src={project.image} />
              <IonIcon icon={arrowForwardSharp} />
              <ProjectMap />
            </div>
            <div className="project-inputs">
              <div className="project-input">
                <IonLabel className="input-label">
                  <div className="input-label-title">budget</div>
                  <Tooltip text="" />
                  <div>:</div>
                </IonLabel>
                <div className="input-text">
                  <IonLabel>
                    {project.balance}/{project.balance} <span>PXMT</span>
                  </IonLabel>
                </div>
              </div>
              <div className="project-input">
                <IonLabel className="input-label">
                  <div className="input-label-title">controls</div>
                  <Tooltip text="" />
                  <div>:</div>
                </IonLabel>
                <div className="input-text">
                  <IonLabel>
                    {controls}/{project.imageH * project.imageW} <span>px</span>
                  </IonLabel>
                </div>
              </div>
              <div className="project-input">
                <IonLabel className="input-label">
                  <div className="input-label-title">deposit</div>
                  <Tooltip text="" />
                  <div>:</div>
                </IonLabel>
                <IonButton
                  className="input-button"
                  fill="clear"
                  id="project-amount-input"
                >
                  <IonLabel>
                    {amount} PXMT <span>({balance} PXMT)</span>
                  </IonLabel>
                </IonButton>
                <StakeAmountPopover
                  onStakeAmountSet={setAmount}
                  trigger="project-amount-input"
                />
              </div>
              <div className="project-input">
                <IonLabel className="input-label">
                  <div className="input-label-title">deposit gas</div>
                  <Tooltip text="" />
                  <div>:</div>
                </IonLabel>
                <IonButton
                  className="input-button"
                  fill="clear"
                  id="project-gas-amount-input"
                >
                  <IonLabel>
                    0.5 S <span>({balance} S)</span>
                  </IonLabel>
                </IonButton>
                <StakeAmountPopover
                  onStakeAmountSet={setAmount}
                  trigger="project-gas-amount-input"
                />
              </div>
            </div>
            <ProjectButton amount={amount} projectAddress={project.address} />
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default memo(ProjectModal);
