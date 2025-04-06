import { decodeEventLog, getEventSelector, Log } from "viem";
import { PixelEvent } from "./types";
import { CONTRACTS } from "../hooks/utils";

export const logToWellFormedEventPixelStaking = (log: Log): PixelEvent => {
  const decoded = decodeEventLog({
    topics: log.topics,
    data: log.data,
    abi: CONTRACTS.PixelStaking.abi,
  });
  return { ...log, ...decoded } as unknown as PixelEvent;
};

export const logToWellFormedEventProjectFactory = (log: Log): any => {
  const decoded = decodeEventLog({
    topics: log.topics,
    data: log.data,
    abi: CONTRACTS.ProjectFactory.abi,
  });
  return { ...log, ...decoded };
};
