import { useCreateProject } from "$features/shared/hooks/useCreateProject";
import { IonButton, IonLabel } from "@ionic/react";
import { memo } from "react";

type Props = {
  imageUrl: string;
};
const CreateProjectButton: React.FC<Props> = ({ imageUrl }) => {
  const { create } = useCreateProject({});

  async function createProject() {
    await create({ imageURI: imageUrl, title: "Project" });
  }
  return (
    <IonButton onClick={createProject}>
      <IonLabel>1. create project</IonLabel>
    </IonButton>
  );
};

export default memo(CreateProjectButton);
