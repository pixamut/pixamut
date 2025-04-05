export type IPixelEventUpdate = {
  id: string;
  logIndex: number;
  hash: string;
  pixelId: number;
  stakeAmount?: number | undefined;
  color?: number | undefined;
  owner?: string | undefined;
  timestamp: string;
};
export type IPixelEvent = {
  id: string;
  logIndex: number;
  hash: string;
  pixelId: number;
  stakeAmount: number;
  color: number;
  owner: string;
  timestamp: string;
};

export type IPixelEventInDB = {
  log_index: number;
  hash: string;
  pixel_id: number;
  stake_amount: number | string;
  color: number;
  owner: string;
  timestamp: string;
};

export function generateId(timestamp: string, logIndex: number): string {
  return `${timestamp}-${logIndex}`;
}
