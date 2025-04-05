import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { createEntityAdapter } from "@reduxjs/toolkit";
import { IPixelEvent, IPixelEventUpdate } from "./pixel-event.interface";
import { setPixels } from "./pixel.slice";
import { local } from "$api/local";
import type { RootState } from "$store/store";
import { server } from "$api/server";
import {
  getProjectMetadata,
  refreshProject,
} from "$features/projects/project.slice";

// API
export const fetchPixelEventsForPixelId = createAsyncThunk(
  "pixelEvents/fetch",
  async (
    pixelId: number,
    thunkAPI,
  ): Promise<{ events: IPixelEvent[]; pixelId: number } | undefined> => {
    const state = thunkAPI.getState() as RootState;
    if (state.pixelEvents[pixelId]) return undefined;
    const events = await server.getPixelEventsForPixel(pixelId);
    return {
      pixelId,
      events,
    };
  },
);

export const addPixelEvents = createAsyncThunk(
  "pixelEvents/add",
  async (events: IPixelEventUpdate[], thunkAPI): Promise<IPixelEvent[]> => {
    if (events.length == 0) return [];
    const state = thunkAPI.getState() as RootState;
    const fullEvents: IPixelEvent[] = events.map((ev) => ({
      ...ev,
      stakeAmount:
        ev.stakeAmount === undefined
          ? state.pixels.entities[ev.pixelId].stakeAmount!
          : ev.stakeAmount,
      color:
        ev.color === undefined
          ? state.pixels.entities[ev.pixelId].color!
          : ev.color,
      owner:
        ev.owner === undefined
          ? state.pixels.entities[ev.pixelId].owner?.toLowerCase()!
          : ev.owner.toLowerCase(),
    }));

    for (const ev of events) {
      if (ev.stakeAmount === undefined) {
        ev.stakeAmount = state.pixels.entities[ev.pixelId].stakeAmount!;
      }
    }

    const affectedProjects = new Set(fullEvents.map((e) => e.owner));
    if (affectedProjects.size > 0) {
      for (const affectedProject of affectedProjects) {
        thunkAPI.dispatch(getProjectMetadata(affectedProject));
      }
    }
    thunkAPI.dispatch(
      setPixels(
        fullEvents.map((e) => ({
          id: e.pixelId,
          color: e.color,
          owner: e.owner,
          stakeAmount: e.stakeAmount,
          hash: e.hash,
        })),
      ),
    );
    return fullEvents;
  },
);
// Adapter
const pixelEventsAdapter = createEntityAdapter<IPixelEvent>({
  sortComparer: (a, b) => a.timestamp.localeCompare(b.timestamp),
});

// Selectors
export const {
  selectAll: selectAllPixelEvents,
  selectById: selectPixelEventById,
} = pixelEventsAdapter.getSelectors((state: any) => state.pixelEvents);

export const selectPixelEventsOfPixel = createSelector(
  [selectAllPixelEvents, (_state: RootState, pixelId: number) => pixelId],
  (pixelEvents, pixelId) => {
    return pixelEvents.filter((event) => event.pixelId === pixelId);
  },
);

type InitialState = {
  status: "loading" | "success" | "error" | "idle";
  [key: string]: boolean | string;
};
const initialState = pixelEventsAdapter.getInitialState<InitialState>({
  status: "idle",
});

export const pixelEventsSlice = createSlice({
  name: "pixelEvents",
  initialState: pixelEventsAdapter.addMany(initialState, []),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPixelEventsForPixelId.pending, (state) => {
      state.status = "loading";
    });
    builder.addCase(fetchPixelEventsForPixelId.rejected, (state) => {
      state.status = "error";
    });
    builder.addCase(
      fetchPixelEventsForPixelId.fulfilled,
      (
        state,
        action: PayloadAction<
          { pixelId: number; events: IPixelEvent[] } | undefined
        >,
      ) => {
        if (action.payload) {
          const { pixelId, events } = action.payload;
          state[pixelId] = true;
          pixelEventsAdapter.upsertMany(state, events);
          state.status = "success";
        }
      },
    );
    builder.addCase(
      addPixelEvents.fulfilled,
      (state, action: PayloadAction<IPixelEvent[]>) => {
        pixelEventsAdapter.upsertMany(state, action.payload);
      },
    );
  },
});

export default pixelEventsSlice.reducer;
