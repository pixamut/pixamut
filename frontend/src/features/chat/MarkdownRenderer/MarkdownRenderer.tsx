import React, { FC } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  children: string;
}

const MarkdownRenderer: FC<MarkdownRendererProps> = ({ children }) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      urlTransform={(uri) => {
        // Allow data URLs by returning them as is.
        if (uri.startsWith("data:")) return uri;
        // Otherwise, use the default behavior (or simply return uri)
        return uri;
      }}
      components={{
        img: ({ node, ...props }) => (
          <img {...props} width="100" height="100" alt={props.alt || ""} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
