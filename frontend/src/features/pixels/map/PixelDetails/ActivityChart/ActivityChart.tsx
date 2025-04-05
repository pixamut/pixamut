import { selectPixelEventsOfPixel } from "$features/pixels/pixelEvents.slice";
import { colorToString } from "$features/shared/utils";
import { useAppSelector } from "$store/hooks";
import { memo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  pixelId: number;
  isDetailed?: boolean | undefined;
};
const ActivityChart: React.FC<Props> = ({ pixelId, isDetailed }) => {
  const events = useAppSelector((state) =>
    selectPixelEventsOfPixel(state, pixelId),
  );

  return (
    <div className="chart-container" style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer>
        <AreaChart
          data={events
            .map((e) => ({ ...e, timestamp: new Date(e.timestamp).getTime() }))
            .sort((a, b) => a.timestamp - b.timestamp)}
        >
          <defs>
            <linearGradient id="colorStake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e2b714" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#e2b714" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            scale="time"
            type="number"
            domain={["auto", "auto"]}
            hide
          />
          <YAxis yAxisId="left" hide />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip
            wrapperStyle={{}}
            contentStyle={{ backgroundColor: "black", opacity: 0.8 }}
            labelFormatter={(d) => new Date(d).toLocaleString()}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="stakeAmount"
            fill="url(#colorStake)"
            stroke="#e2b714"
            dot={
              isDetailed
                ? (props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <rect
                        x={cx - 3}
                        y={cy - 3}
                        width={6}
                        height={6}
                        strokeWidth={1}
                        stroke="#2c2e31"
                        key={payload.id}
                        fill={colorToString(payload.color)}
                      />
                    );
                  }
                : false
            }
            isAnimationActive={!isDetailed}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(ActivityChart);
