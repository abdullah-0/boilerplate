import { configureStore } from "@reduxjs/toolkit";

import { userApi } from "@/api/user/userApi";
import { teamApi } from "@/api/team/teamApi";

export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware, teamApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
