import {
  BaseQueryApi,
  createApi,
  FetchArgs,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "..";
import {
  ForgetPasswordForm,
  LoginForm,
  ResetPasswordForm,
  roleSelectionData,
  SignUpForm,
} from "@errandhub/shared";
import { TAGS } from "@/utils/constants";
import { logoutUser } from "../slices";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
) => {
  const result = await baseQuery(args, api, {});
  if (result?.error?.status === 401) {
    api.dispatch(logoutUser());
  }
  return result;
};

export const api = createApi({
  refetchOnReconnect: true,
  tagTypes: Object.values(TAGS),
  baseQuery: baseQueryWithReauth,
  endpoints: (build) => ({
    createAccount: build.mutation({
      query: (data: SignUpForm) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
    }),
    loginUser: build.mutation({
      query: (credentials: LoginForm) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    forgetPassword: build.mutation({
      query: (data: ForgetPasswordForm) => ({
        url: "auth/forget-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: build.mutation({
      query: (data: ResetPasswordForm) => ({
        url: "auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    selectRole: build.mutation({
      query: ({ userId, role }: roleSelectionData) => ({
        url: `/auth/select-role/${userId}`,
        method: "POST",
        body: { role },
      }),
    }),
  }),
});

export const {
  useLoginUserMutation,
  useSelectRoleMutation,
  useCreateAccountMutation,
  useResetPasswordMutation,
  useForgetPasswordMutation,
} = api;
