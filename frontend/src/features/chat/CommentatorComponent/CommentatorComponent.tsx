import React, { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { server } from "$api/server";
import { AssistantResponse, ChatMessage } from "../chat.interface";

import "./CommentatorComponent.scss";
import {
  IonButton,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
} from "@ionic/react";
import { imageSharp, sendSharp } from "ionicons/icons";
import ImageModal from "$features/chat/ImageModal/ImageModal";
import AssistantDisplay from "../AssitantDisplay/AssistantDisplay";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
const ChatComponent: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    // Append the user message to chat history
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userInput },
    ];
    setChatHistory(updatedHistory);
    setUserInput("");
    setIsAnswering(true);

    try {
      // Send the full conversation to the backend
      const fullResponse = await server.chatCommentator(updatedHistory);

      // Prepare for animated display
      let currentIndex = 0;

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ]);
      setIsAnswering(false);
      // Simulate a typing effect (adjust delay as needed)
      // const interval = setInterval(() => {
      //   setAnimatedResponse((prev) => prev + fullResponse[currentIndex]);
      //   currentIndex++;
      //   if (currentIndex >= fullResponse.length) {
      //     clearInterval(interval);
      //     // Once done, add the complete AI response to chat history
      //     setChatHistory((prev) => [
      //       ...prev,
      //       { role: "assistant", content: fullResponse },
      //     ]);
      //     setIsAnimating(false);
      //   }
      // }, 50);
    } catch (err) {
      console.error("Error fetching AI response:", err);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-content">
        {chatHistory.map((msg, index) => (
          <div
            className={`chat-message ${msg.role}`}
            key={index}
            style={{ marginBottom: "10px" }}
          >
            <div className="chat-message-content">
              <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <IonTextarea
          value={userInput}
          rows={2}
          onIonInput={(e) => setUserInput(e.detail.value!)}
          placeholder="Type your message here..."
        />
        <IonButton onClick={sendMessage} disabled={isAnswering} fill="clear">
          {isAnswering ? (
            <IonSpinner />
          ) : (
            <IonIcon slot="icon-only" icon={sendSharp} />
          )}
        </IonButton>
      </div>
    </div>
  );
};

export default memo(ChatComponent);
