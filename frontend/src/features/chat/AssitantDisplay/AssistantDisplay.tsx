import React, { memo, useState } from "react";
import { AssistantResponse } from "../chat.interface";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
import { IonButton, IonLabel } from "@ionic/react";

import "./AssistantDisplay.scss";
import CreateProject from "./CreateProject";
import Clarify from "./Clarify";
interface AssistantDisplayProps {
  data: AssistantResponse;
}

const AssistantDisplay: React.FC<AssistantDisplayProps> = ({ data }) => {
  console.log(data);
  if (data.intent == "clarify") {
    return <Clarify payload={data.payload} />;
  } else if (data.intent == "createProject") {
    const content =
      typeof data.payload === "string"
        ? JSON.parse(data.payload)
        : (data.payload as {
            imageURI: string;
            title: string;
          });
    return <CreateProject imageURI={content.imageURI} title={content.title} />;
  }

  return <></>;
};

export default memo(AssistantDisplay);
