type IProjectCommon = {
  address: string;
  title: string;
  image: string;
  creator: string;
};
export type IProject = IProjectCommon & {
  imageH: number;
  imageW: number;
  nbrActivePixels: number;
  balance: number;
  bestRow: number | null | undefined;
  bestCol: number | null | undefined;
  bestCost: number | null | undefined;
  gasUsed: number | null | undefined;
  gasAvailable: number | null | undefined;
};

export type IProjectMetadata = {
  address: string;
  balance: number;
  bestRow: number | null | undefined;
  bestCol: number | null | undefined;
  bestCost: number | null | undefined;
  gasUsed: number | null | undefined;
  gasAvailable: number | null | undefined;
};

export type IProjectInDB = IProjectCommon & {
  balance: string;
  best_cost: string | null;
  best_row: number | null;
  best_col: number | null;
  image_h: number | null;
  image_w: number | null;
  nbr_active_pixels: number;
  gas_used: number | null | undefined;
  gas_available: number | null | undefined;
};

export type IProjectMetadataInDB = {
  address: string;
  balance: string;
  best_cost: string | null;
  best_row: number | null;
  best_col: number | null;
  gas_used: number | null | undefined;
  gas_available: number | null | undefined;
};
