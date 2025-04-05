import { Address } from "viem";
import PixelStakingJSON from "$abis/PixelStaking.json";
import IFYSTokenJSON from "$abis/IFYSToken.json";
import ProjectFactoryJSON from "$abis/ProjectFactory.json";

export const CONTRACTS = {
  PixelStaking: {
    address:
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" satisfies Address as Address,
    abi: PixelStakingJSON.abi,
  },
  IFYSToken: {
    address:
      "0x5FbDB2315678afecb367f032d93F642f64180aa3" satisfies Address as Address,
    abi: IFYSTokenJSON.abi,
  },
  ProjectFactory: {
    address:
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" satisfies Address as Address,
    abi: ProjectFactoryJSON.abi,
  },
};
