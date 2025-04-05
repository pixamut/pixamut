import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { IUser } from "./user.interface";
import { local } from "$api/local";
import { server } from "$api/server";

export const logoutUserLocally = createAsyncThunk(
  "user/logoutLocally",
  async (_, thunkAPI): Promise<void> => {
    await local.logoutUser();
    server.setAuthHeader();
  },
);
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, thunkAPI): Promise<void> => {},
);
// Slice
interface UserState extends IUser {}

const userSlice = createSlice({
  name: "user",
  initialState: { username: undefined } satisfies UserState,
  reducers: {},
  extraReducers: (builder) => {},
});

export default userSlice.reducer;
