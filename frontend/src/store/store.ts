import { combineReducers, configureStore } from "@reduxjs/toolkit";
import pixelsReducer from "$features/pixels/pixel.slice";
import usersReducer from "$features/user/user.slice";
import pixelEventsReducer from "$features/pixels/pixelEvents.slice";
import projectsReducer from "$features/projects/project.slice";

const rootReducer = combineReducers({
  pixels: pixelsReducer,
  user: usersReducer,
  pixelEvents: pixelEventsReducer,
  projects: projectsReducer,
});

export const setupStore = (preloadedState?: RootState) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: import.meta.env.VITE_ENV !== "production",
  });
};
export const store = setupStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = typeof store.dispatch;
