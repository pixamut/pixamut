import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { createEntityAdapter } from "@reduxjs/toolkit";
import { server } from "$api/server";
import { IProject, IProjectMetadata } from "./project.interface";

// API
export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (_, thunkAPI): Promise<IProject[]> => {
    const projects = await server.getProjects();
    return projects;
  },
);

export const getProjectMetadata = createAsyncThunk(
  "projects/getProjectMetadata",
  async (address: string, thunkAPI): Promise<IProjectMetadata | undefined> => {
    const project = await server.getProjectMetadata(address);
    return project;
  },
);

export const refreshProject = createAsyncThunk(
  "projects/refreshProject",
  async (address: string, thunkAPI): Promise<IProject | undefined> => {
    const project = await server.getProject(address);
    return project;
  },
);

// Adapter
const projectAdapter = createEntityAdapter<IProject, string>({
  selectId: (p) => p.address,
  sortComparer: (a: IProject, b: IProject) => a.balance - b.balance,
});

// Selectors
export const {
  selectAll: selectAllProjects,
  selectById: selectProjectByAddress,
} = projectAdapter.getSelectors((state: any) => state.projects);

type InitialState = {
  status: "loading" | "success" | "error" | "idle";
};
const initialState = projectAdapter.getInitialState<InitialState>({
  status: "idle",
});

export const projectSlice = createSlice({
  name: "projects",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProjects.pending, (state) => {
      state.status = "loading";
    });
    builder.addCase(fetchProjects.rejected, (state) => {
      state.status = "error";
    });
    builder.addCase(
      fetchProjects.fulfilled,
      (state, { payload }: PayloadAction<IProject[]>) => {
        state.status = "success";
        projectAdapter.upsertMany(state, payload);
      },
    );
    builder.addCase(
      refreshProject.fulfilled,
      (state, { payload }: PayloadAction<IProject | undefined>) => {
        state.status = "success";
        if (payload) projectAdapter.upsertOne(state, payload);
      },
    );
    builder.addCase(
      getProjectMetadata.fulfilled,
      (state, { payload }: PayloadAction<IProjectMetadata | undefined>) => {
        state.status = "success";
        if (payload)
          projectAdapter.updateOne(state, {
            id: payload.address,
            changes: payload,
          });
      },
    );
  },
});

export const {} = projectSlice.actions;

export default projectSlice.reducer;
