import { memo } from "react";
import { IonContent, IonPage } from "@ionic/react";

import "./Processing.scss";
import ImageProcessing from "$features/projects/ImageProcessing/ImageProcessing";
const ProcessingPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="processing-main-container">
          <ImageProcessing />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default memo(ProcessingPage);
