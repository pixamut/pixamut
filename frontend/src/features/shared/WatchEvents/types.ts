import { Address, Log } from "viem";

type BasicEvent = Log & {
  eventName:
    | "PixelStaked"
    | "PixelsStaked"
    | "PixelUnstaked"
    | "PixelsUnstaked"
    | "PixelColorChanged"
    | "PixelsColorChanged";
  blockTimestamp: number;
  transactionHash: string;
  logIndex: number;
};
export type PixelStakedEvent = BasicEvent & {
  eventName: "PixelStaked";
  args: {
    staker: Address;
    pixelId: number;
    amount: bigint;
    color: number;
  };
};
export type PixelsStakedEvent = BasicEvent & {
  eventName: "PixelsStaked";
  args: {
    staker: Address;
    pixelIds: number[];
    amounts: bigint[];
    colors: number[];
  };
};
export type PixelUnstakedEvent = BasicEvent & {
  eventName: "PixelUnstaked";
  args: {
    staker: Address;
    pixelId: number;
  };
};
export type PixelsUnstakedEvent = BasicEvent & {
  eventName: "PixelsUnstaked";
  args: {
    staker: Address;
    pixelIds: number[];
  };
};
export type PixelColorChangedEvent = BasicEvent & {
  eventName: "PixelColorChanged";
  args: {
    pixelId: number;
    color: number;
  };
};
export type PixelsColorChangedEvent = BasicEvent & {
  eventName: "PixelsColorChanged";
  args: {
    pixelIds: number[];
    colors: number[];
  };
};

export type PixelEvent =
  | PixelStakedEvent
  | PixelUnstakedEvent
  | PixelColorChangedEvent
  | PixelsStakedEvent
  | PixelsUnstakedEvent
  | PixelsColorChangedEvent;

type ProjectCreatedEvent = BasicEvent & {
  args: {
    creator: string;
    projectAddress: string;
    base64Image: string;
  };
};
