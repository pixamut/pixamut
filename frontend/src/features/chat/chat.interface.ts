export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantResponse = {
  intent: string;
  payload: string;
};
