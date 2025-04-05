import { memo, useState } from "react";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
import { IonButton, IonLabel, IonSpinner } from "@ionic/react";
import { useCreateProject } from "$features/shared/hooks/useCreateProject";
import ProjectModal from "$features/projects/modals/ProjectModal/ProjectModal";

type Props = {
  imageURI: string;
  title: string;
};
const CreateProject: React.FC<Props> = ({ imageURI, title }) => {
  const { create } = useCreateProject({});

  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [projectAddress, setProjectAddress] = useState<string>("");

  async function createProject() {
    setLoading(true);
    const address = await create({ title, imageURI });
    setProjectAddress(address);
    setLoading(false);
  }

  async function fundProject() {
    setShowModal(true);
  }
  return (
    <div className="create-project">
      <MarkdownRenderer>{`- **project title:** ${title}  \n ![project_image](${imageURI})`}</MarkdownRenderer>
      <IonButton disabled={loading || !!projectAddress} onClick={createProject}>
        <IonLabel>1. create project</IonLabel>
        {loading && <IonSpinner />}
      </IonButton>
      <IonButton disabled={!projectAddress} onClick={fundProject}>
        <IonLabel>2. fund project</IonLabel>
      </IonButton>
      {projectAddress && (
        <ProjectModal
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          projectAddress={projectAddress}
        />
      )}
    </div>
  );
};

export default memo(CreateProject);
