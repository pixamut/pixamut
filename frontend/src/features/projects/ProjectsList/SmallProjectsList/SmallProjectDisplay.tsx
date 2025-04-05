import { selectProjectByAddress } from "$features/projects/project.slice";
import { useAppSelector } from "$store/hooks";
import { memo, useState } from "react";
import CircularImageProgress from "../../../shared/CircularImageProgress/CircularImageProgress";
import { selectControlOfOwner } from "$features/pixels/pixel.slice";
import { IonCard, IonRippleEffect } from "@ionic/react";
import ProjectModal from "$features/projects/modals/ProjectModal/ProjectModal";

type Props = {
  projectAddress: string;
};
const SmallProjectDisplay: React.FC<Props> = ({ projectAddress }) => {
  const project = useAppSelector((state) =>
    selectProjectByAddress(state, projectAddress),
  );
  const controls = useAppSelector((state) =>
    selectControlOfOwner(state, projectAddress),
  );
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <IonCard
        button
        className="small-project-display-container"
        onClick={() => setShowModal(true)}
      >
        <IonRippleEffect />
        <div className="small-project-content">
          <CircularImageProgress
            progress={controls}
            src={project.image}
            strokeWidth={2}
            size={35}
          />
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

export default memo(SmallProjectDisplay);
