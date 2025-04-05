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

const WatchEvents: React.FC = () => {
  const dispatch = useAppDispatch();
  useWatchContractEvent({
    ...CONTRACTS.PixelStaking,
    onLogs(logs) {
      const events: IPixelEventUpdate[] = [];
      for (const log of logs) {
        const l = log as unknown as PixelEvent;
        if (l.eventName == "PixelStaked") {
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
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
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
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
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
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
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
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
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
          events.push({
            id: generateId(timestamp, l.logIndex),
            logIndex: l.logIndex,
            hash: l.transactionHash.toLowerCase(),
            pixelId: l.args.pixelId,
            color: l.args.color,
            timestamp,
          });
        } else if (l.eventName == "PixelsColorChanged") {
          console.log("Pixels colors changed", l);
          const timestamp = new Date(
            Number(l.blockTimestamp) * 1000,
          ).toISOString();
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
        const address = (log as any).args.projectAddress;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        dispatch(refreshProject(address));
      }
    },
  });
  return null;
};

export default memo(WatchEvents);
