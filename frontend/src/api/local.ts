import { Storage, Drivers } from "@ionic/storage";
import { IUser } from "../features/user/user.interface";
import { IPixelEvent } from "$features/pixels/pixel-event.interface";

const storage = new Storage({
  name: "stakepxmt",
  driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
});
storage.create();

export const local = {
  getUser: async (): Promise<IUser | undefined> => {
    return await storage.get("user");
  },
  setUser: async (user: IUser | undefined) => {
    await storage.set("user", user);
  },
  logoutUser: async () => {
    await storage.remove("user");
  },

  // setLastCheckedTimestamp: async (timestamp: number) => {
  //   return await storage.get("lastCheckedTimestamp");
  // },
  // getLastCheckedTimestamp: async (timestamp: number) => {
  //   await storage.set("lastCheckedTimestamp", timestamp);
  // },

  // upsertLocalPixelEvents: async (events: IPixelEvent[]) => {
  //   const lastCheckedTimestamp = await storage.get("lastCheckedTimestamp");
  //   const data: Record<string, IPixelEvent> =
  //     (await storage.get("pixelEvents")) || {};
  //   for (const e of events) {
  //     data[e.id] = e;
  //     if (e.timestamp > lastCheckedTimestamp) {
  //       await storage.set("lastCheckedTimestamp", e.timestamp);
  //     }
  //   }
  //   await storage.set("pixelEvents", data);
  // },
  // getLocalPixelEvents: async (): Promise<IPixelEvent[]> => {
  //   const data: Record<string, IPixelEvent> =
  //     (await storage.get("pixelEvents")) || {};
  //   return Object.values(data);
  // },
};
