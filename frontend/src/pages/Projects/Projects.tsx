import React, { memo } from "react";
import { IonContent, IonPage } from "@ionic/react";

import ChatComponent from "$features/chat/ChatComponent/ChatComponent";

import "./Projects.scss";
const ProjectsPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="page-main-container projects-main-container">
          <ChatComponent />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default memo(ProjectsPage);
