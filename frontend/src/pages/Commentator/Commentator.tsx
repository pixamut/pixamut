import React, { memo } from "react";
import { IonContent, IonPage } from "@ionic/react";

import ChatComponent from "$features/chat/ChatComponent/ChatComponent";

import "./Commentator.scss";
import CommentatorComponent from "$features/chat/CommentatorComponent/CommentatorComponent";
const CommentatorPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="page-main-container commentator-main-container">
          <CommentatorComponent />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default memo(CommentatorPage);
