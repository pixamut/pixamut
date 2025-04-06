import { Address } from "viem";
import PixelStakingJSON from "$abis/PixelStaking.json";
import PXMTTokenJSON from "$abis/Token.json";
import ProjectFactoryJSON from "$abis/ProjectFactory.json";

export const CONTRACTS = {
  PixelStaking: {
    address:
      "0x3f1F95ac8732B2F4732bbdFc9D144F9c604B3782" satisfies Address as Address,
    abi: PixelStakingJSON.abi,
  },
  Token: {
    address:
      "0x1c679bdf9e83Ce9e3C46A1E3aE8dD6B55A4A3f8A" satisfies Address as Address,
    abi: PXMTTokenJSON.abi,
  },
  ProjectFactory: {
    address:
      "0x01Ae2f46f464e7c07F878e054c7897978dD44075" satisfies Address as Address,
    abi: ProjectFactoryJSON.abi,
  },
};
