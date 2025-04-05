import React from "react";

import "./CircularImageProgress.scss";
interface CircularImageProgressProps {
  src: string;
  progress: number; // value between 0 and 1
  size?: number; // defaults to 35
  strokeWidth?: number; // width of the progress circle
  borderColor?: string; // background circle color
  progressColor?: string; // progress circle color
}

const CircularImageProgress: React.FC<CircularImageProgressProps> = ({
  src,
  progress,
  size = 44,
  strokeWidth = 4,
}) => {
  const halfSize = size / 2;
  // The radius is reduced by the stroke width so the circle stays within the bounds
  const radius = halfSize - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Calculate the stroke dash offset based on the progress value.
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className="circular-image-container"
      style={{ position: "relative", width: size, height: size }}
    >
      {/* The circular image */}
      <img
        src={src}
        alt="Progress"
        style={{
          position: "relative",
          top: strokeWidth / 2,
          left: strokeWidth / 2,
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderRadius: "50%",
          display: "block",
        }}
      />
      {/* The SVG overlay */}
      <svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "rotate(-90deg)", // rotates so progress starts at the top
        }}
      >
        {/* Background circle */}
        {/* <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
          fill="transparent"
        /> */}
        {/* Progress circle */}
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          stroke="var(--progress-color)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" // optional: makes the ends of the progress stroke rounded
        />
      </svg>
    </div>
  );
};

export default CircularImageProgress;
