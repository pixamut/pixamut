import { zeroAddress, zeroHash } from "viem";
import { IPixel } from "./pixel.interface";

export const WIDTH = 100;
export const HEIGHT = 100;

export const PIXEL_IDS: number[] = Array.from(
  { length: WIDTH * HEIGHT },
  (_, index) => index,
);
export const INITIAL_PIXELS: IPixel[] = PIXEL_IDS.map((index) => ({
  id: index,
  x: index % WIDTH,
  y: Math.floor(index / WIDTH),
  color: 0x000000, //0x646669,
  stakeAmount: 0,
  owner: zeroAddress,
  hash: zeroHash,
}));
