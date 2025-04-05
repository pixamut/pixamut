import { Address } from "viem";

export type IPixelUpdate = {
  id: number;
  color?: number | undefined;
  stakeAmount?: number | undefined;
  owner?: string | undefined;
  hash: string;
};
export type IPixel = IPixelUpdate & {
  x: number;
  y: number;
};

export type IPixelInDB = {
  id: number;
  color: number;
  stake_amount: number | string;
  owner: string;
  hash: string;
};
