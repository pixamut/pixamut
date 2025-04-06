import Axios from "axios";
import { IUser, IUserWithPassword } from "../features/user/user.interface";
import {
  IPixel,
  IPixelInDB,
  IPixelUpdate,
} from "../features/pixels/pixel.interface";
import {
  generateId,
  IPixelEvent,
  IPixelEventInDB,
} from "$features/pixels/pixel-event.interface";
import { Address, formatEther } from "viem";
import {
  IProject,
  IProjectInDB,
  IProjectMetadata,
  IProjectMetadataInDB,
} from "$features/projects/project.interface";
import { ChatMessage } from "$features/chat/chat.interface";

const API_SERVER = "http://pixamut.fun/api";
// const API_SERVER = "http://localhost:1234/api";
const STAKE_ENDPOINT = "pixamut";
const axios = Axios.create({
  baseURL: `${API_SERVER}`,
  headers: { "Content-Type": "application/json" },
});

export const server = {
  // axios config
  addResponseInterceptor: (
    onFulfilled: (value: any) => any,
    onRejected: (error: any) => any
  ) => {
    axios.interceptors.response.use(onFulfilled, onRejected);
  },
  setAuthHeader: (user?: IUser) => {
    const tokenString: string | undefined = user
      ? `${user.tokenType} ${user.accessToken}`
      : undefined;
    axios.defaults.headers.common.Authorization = tokenString;
  },
  refreshToken: async (): Promise<IUser> => {
    const tokenData = await axios.get<IUser>("cookie/refresh", {
      withCredentials: true,
    });
    return tokenData.data;
  },
  logout: async (): Promise<void> => {
    await axios.get("cookie/logout", { withCredentials: true });
  },

  // User
  login: async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<IUser> => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    const res = await axios.post<IUser>("login/password/metisify", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return res.data;
  },
  register: async (user: IUserWithPassword): Promise<IUser> => {
    const res = await axios.post<IUser>("users/metisify", user, {
      withCredentials: true,
    });
    return res.data;
  },
  updateUser: async (user: IUserWithPassword): Promise<IUser> => {
    const res = await axios.put<IUser>("users/me/", user);
    return res.data;
  },
  isUsernameAvailable: async (username: string): Promise<boolean> => {
    const res = await axios.get<boolean>(`users/username/${username}`);
    return !res.data;
  },
  isEmailAvailable: async (email: string): Promise<boolean> => {
    const res = await axios.get<boolean>(`users/email/${email}`);
    return !res.data;
  },
  // chat
  chat: async (messages: Array<ChatMessage>): Promise<string> => {
    const res = await axios.post<{ response: string }>(
      `${STAKE_ENDPOINT}/chat`,
      { messages }
    );
    return res.data.response;
  },
  chatCommentator: async (messages: Array<ChatMessage>): Promise<string> => {
    const res = await axios.post<{ response: string }>(
      `${STAKE_ENDPOINT}/chat/commentator`,
      { messages }
    );
    return res.data.response;
  },

  // Pixels
  getPixels: async (): Promise<Array<IPixelUpdate>> => {
    const res = await axios.get<Array<IPixelInDB>>(`${STAKE_ENDPOINT}/pixels`);
    return res.data.map((p) => ({
      id: p.id,
      color: p.color,
      owner: p.owner as Address,
      stakeAmount: Number(formatEther(BigInt(p.stake_amount))),
      hash: p.hash,
    }));
  },

  getPixelEventsForPixel: async (
    pixelId: number
  ): Promise<Array<IPixelEvent>> => {
    const res = await axios.get<Array<IPixelEventInDB>>(
      `${STAKE_ENDPOINT}/pixelEvents/${pixelId}`
    );
    return res.data.map((e) => ({
      id: generateId(e.timestamp, e.log_index),
      pixelId: e.pixel_id,
      logIndex: e.log_index,
      color: e.color,
      owner: e.owner as Address,
      hash: e.hash,
      stakeAmount: Number(formatEther(BigInt(e.stake_amount))),
      timestamp: e.timestamp,
    }));
  },
  // projects
  getProjects: async (): Promise<Array<IProject>> => {
    const res = await axios.get<Array<IProjectInDB>>(
      `${STAKE_ENDPOINT}/projects`
    );
    return res.data.map((p) => ({
      ...p,
      bestRow: p.best_row,
      bestCol: p.best_col,
      bestCost: p.best_cost
        ? Number(formatEther(BigInt(p.best_cost)))
        : undefined,
      balance: Number(formatEther(BigInt(p.balance))),
      imageW: p.image_w ?? 0,
      imageH: p.image_h ?? 0,
      gasUsed: Number(formatEther(BigInt(p.gas_used ?? 0))),
      nbrActivePixels: p.nbr_active_pixels,
      gasAvailable: Number(formatEther(BigInt(p.gas_available ?? 0))),
    }));
  },
  getProject: async (address: string): Promise<IProject | undefined> => {
    const res = await axios.get<IProjectInDB | undefined>(
      `${STAKE_ENDPOINT}/projects/${address}`
    );

    const p = res.data;
    if (p) {
      return {
        ...p,
        bestRow: p.best_row,
        bestCol: p.best_col,
        bestCost: p.best_cost
          ? Number(formatEther(BigInt(p.best_cost)))
          : undefined,
        balance: Number(formatEther(BigInt(p.balance))),
        imageW: p.image_w ?? 0,
        imageH: p.image_h ?? 0,
        gasUsed: Number(formatEther(BigInt(p.gas_used ?? 0))),
        gasAvailable: Number(formatEther(BigInt(p.gas_available ?? 0))),
        nbrActivePixels: p.nbr_active_pixels,
      };
    }
  },

  getProjectMetadata: async (
    address: string
  ): Promise<IProjectMetadata | undefined> => {
    const res = await axios.get<IProjectMetadataInDB | undefined>(
      `${STAKE_ENDPOINT}/projects/metadata/${address}`
    );

    const p = res.data;
    if (p) {
      return {
        ...p,
        bestRow: p.best_row,
        bestCol: p.best_col,
        bestCost: p.best_cost
          ? Number(formatEther(BigInt(p.best_cost)))
          : undefined,
        balance: Number(formatEther(BigInt(p.balance))),
        gasUsed: Number(formatEther(BigInt(p.gas_used ?? 0))),
        gasAvailable: Number(formatEther(BigInt(p.gas_available ?? 0))),
      };
    }
  },
};
