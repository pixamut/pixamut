import { memo, useEffect, useState } from "react";
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";

type Props = {
  payload: string;
};
const Clarify: React.FC<Props> = ({ payload }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < payload.length) {
        setDisplayedText(payload.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [payload]);

  return <MarkdownRenderer>{displayedText}</MarkdownRenderer>;
};

export default memo(Clarify);
