import { getEventSelector, Log } from "viem";
import { PixelEvent } from "./types";
import { CONTRACTS } from "../hooks/utils";
import { toSignatureHash } from "viem/_types/utils/hash/toSignatureHash";

const getEventFromAbi = (abi: any[], eventName: string): any[] => {
  return abi.filter((item: any) => item.name === eventName);
};

export const logToWellFormedEventPixelStaking = (
  event: Log
): PixelEvent | void => {
  const pixelStakedSignature = toSignatureHash(
    getEventFromAbi(CONTRACTS.PixelStaking.abi, "PixelStaked")[0]
  );

  // const pixelsStakedSignature = toSignatureHash(getEventFromAbi(CONTRACTS.PixelStaking.abi, 'PixelsStaked')[0])

  // const pixelsStakedSignature = toSignatureHash(getEventFromAbi(CONTRACTS.PixelStaking.abi, 'PixelsStaked')[0])

  // const pixelsStakedSignature = toSignatureHash(getEventFromAbi(CONTRACTS.PixelStaking.abi, 'PixelsStaked')[0])

  // const pixelsStakedSignature = toSignatureHash(getEventFromAbi(CONTRACTS.PixelStaking.abi, 'PixelsStaked')[0])
};

// address
// :
// "0x3f1f95ac8732b2f4732bbdfc9d144f9c604b3782"
// blockHash
// :
// "0x41727da8bed272d6b1dabc94bb3e41619789fc357330d0ffdc099b83d276d3c2"
// blockNumber
// :
// 1173980n
// data
// :
// "0x00000000000000000000000039e3d71655a18118bc326de050a741a4b256c49f00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000001b207"
// logIndex
// :
// 1
// removed
// :
// false
// topics
// :
// ['0x78f3ab8786803634044daaef5059fe2c4ea9510242b9799afd71a6ed65bf97d4']
// transactionHash
// :
// "0xbd4db923c1f1d58bb09307b7996fe4b332cf518f84388dcfa4b22776a055f32e"
// transactionIndex
// :
// 0
