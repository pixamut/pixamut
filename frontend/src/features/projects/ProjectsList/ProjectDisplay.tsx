import { useAppSelector } from "$store/hooks";
import { memo, useState } from "react";
import { selectProjectByAddress } from "../project.slice";
import {
  IonCard,
  IonCardContent,
  IonImg,
  IonProgressBar,
  IonRippleEffect,
} from "@ionic/react";
import { shortenAddress } from "$features/shared/utils";
import {
  selectControlOfOwner,
  selectUsedOfOwner,
} from "$features/pixels/pixel.slice";
import ProjectModal from "../modals/ProjectModal/ProjectModal";

type Props = {
  projectAddress: string;
};
const ProjectDisplay: React.FC<Props> = ({ projectAddress }) => {
  const project = useAppSelector((state) =>
    selectProjectByAddress(state, projectAddress),
  );
  const controls = useAppSelector((state) =>
    selectControlOfOwner(state, projectAddress),
  );
  const used = useAppSelector((state) =>
    selectUsedOfOwner(state, projectAddress),
  );
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <IonCard button onClick={() => setShowModal(true)}>
        <IonRippleEffect />
        <div className="project-display-item-container">
          <div className="project-tile">
            <div className="project-image">
              <IonImg src={project.image} />
              <div className="image-infos">
                {project.imageW}x{project.imageH}
              </div>
            </div>
            <div className="project-infos">
              <div className="row">
                <div className="field">project</div>
                <div>:</div>
                <div className="value">{project.title}</div>
              </div>
              <div className="row">
                <div className="field">address</div>
                <div>:</div>
                <div className="value">
                  {shortenAddress(project.address, 4)}
                </div>
              </div>
              <div className="row">
                <div className="field">budget</div>
                <div>:</div>
                <div className="value">
                  {Math.round(used)}/{Math.round(project.balance)}
                  <span className="unit"> PXMT</span>
                </div>
              </div>
              <div className="row">
                <div className="field">gas used</div>
                <div>:</div>
                <div className="value">
                  {(project.gasUsed || 0).toFixed(2)}/
                  {(project.gasAvailable || 0).toFixed(2)}
                  <span className="unit"> S</span>
                </div>
              </div>
              <div className="row">
                <div className="field">controls</div>
                <div>:</div>
                <div className="value">
                  {controls}/{project.nbrActivePixels}
                  <span className="unit"> px</span>
                </div>
              </div>
            </div>
          </div>
          <div className="progress">
            <IonProgressBar value={controls / project.nbrActivePixels} />
          </div>
        </div>
      </IonCard>
      <ProjectModal
        isOpen={showModal}
        onDidDismiss={() => setShowModal(false)}
        projectAddress={projectAddress}
      />
    </>
  );
};

export default memo(ProjectDisplay);
