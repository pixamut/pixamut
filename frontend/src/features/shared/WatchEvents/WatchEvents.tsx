import { useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "../hooks/utils";
import { memo } from "react";
import { useAppDispatch } from "$store/hooks";
import {
  generateId,
  IPixelEvent,
  IPixelEventUpdate,
} from "$features/pixels/pixel-event.interface";
import { Address, formatEther, Log } from "viem";
import { addPixelEvents } from "$features/pixels/pixelEvents.slice";
import {
  fetchProjects,
  refreshProject,
} from "$features/projects/project.slice";
import { PixelEvent } from "./types";
import {
  logToWellFormedEventPixelStaking,
  logToWellFormedEventProjectFactory,
} from "./utils";

const WatchEvents: React.FC = () => {
  const dispatch = useAppDispatch();
  useWatchContractEvent({
    ...CONTRACTS.PixelStaking,
    onLogs(logs) {
      const events: IPixelEventUpdate[] = [];
      const timestamp = new Date().toISOString();
      for (const log of logs) {
        const l = logToWellFormedEventPixelStaking(log);
        console.log("pixelStaking", l);
        if (l.eventName == "PixelStaked") {
          events.push({
            id: generateId(timestamp, l.logIndex),
            logIndex: l.logIndex,
            hash: l.transactionHash.toLowerCase(),
            pixelId: l.args.pixelId,
            color: l.args.color,
            owner: l.args.staker,
            stakeAmount: Number(formatEther(l.args.amount)),
            timestamp,
          });
        } else if (l.eventName == "PixelsStaked") {
          for (let i = 0; i < l.args.pixelIds.length; i++) {
            events.push({
              id: generateId(timestamp, l.logIndex),
              logIndex: l.logIndex,
              hash: l.transactionHash.toLowerCase(),
              pixelId: l.args.pixelIds[i],
              color: l.args.colors[i],
              owner: l.args.staker,
              stakeAmount: Number(formatEther(l.args.amounts[i])),
              timestamp,
            });
          }
        } else if (l.eventName == "PixelUnstaked") {
          events.push({
            id: generateId(timestamp, l.logIndex),
            logIndex: l.logIndex,
            hash: l.transactionHash.toLowerCase(),
            pixelId: l.args.pixelId,
            color: 0,
            owner: l.args.staker,
            stakeAmount: 0,
            timestamp,
          });
        } else if (l.eventName == "PixelsUnstaked") {
          for (let i = 0; i < l.args.pixelIds.length; i++) {
            events.push({
              id: generateId(timestamp, l.logIndex),
              logIndex: l.logIndex,
              hash: l.transactionHash.toLowerCase(),
              pixelId: l.args.pixelIds[i],
              color: 0,
              owner: l.args.staker,
              stakeAmount: 0,
              timestamp,
            });
          }
        } else if (l.eventName == "PixelColorChanged") {
          events.push({
            id: generateId(timestamp, l.logIndex),
            logIndex: l.logIndex,
            hash: l.transactionHash.toLowerCase(),
            pixelId: l.args.pixelId,
            color: l.args.color,
            timestamp,
          });
        } else if (l.eventName == "PixelsColorChanged") {
          for (let i = 0; i < l.args.pixelIds.length; i++) {
            events.push({
              id: generateId(timestamp, l.logIndex),
              logIndex: l.logIndex,
              hash: l.transactionHash.toLowerCase(),
              pixelId: l.args.pixelIds[i],
              color: l.args.colors[i],
              timestamp,
            });
          }
        }
        dispatch(addPixelEvents(events));
      }
    },
  });

  useWatchContractEvent({
    ...CONTRACTS.ProjectFactory,
    onLogs: async (logs) => {
      for (const log of logs) {
        const l = logToWellFormedEventProjectFactory(log);
        const address = (l as any).args.projectAddress;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        dispatch(refreshProject(address));
      }
    },
  });
  return null;
};

export default memo(WatchEvents);
