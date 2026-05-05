import { ErrandStatus } from "@errandhub/shared";
import { api } from ".";
import { TAGS } from "@/utils/constants";

// User/profile endpoints. The two list queries accept an optional status
// filter — RTK Query keys cache entries on the argument so filtered and
// unfiltered views coexist without stomping on each other.
const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserDetails: builder.query({
      query: () => ({
        url: `user/me`,
        method: "GET",
      }),
      providesTags: [TAGS.USER],
    }),
    getRequestedErrands: builder.query<
      {
        errands: any[];
        summary: {
          totalActive: number;
          totalCompleted: number;
          totalErrands: number;
        };
      },
      { status?: ErrandStatus | ErrandStatus[] } | void
    >({
      query: (arg) => ({
        url: `user/requested-errands`,
        method: "GET",
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: [TAGS.REQUESTED_ERRANDS],
    }),
    getHelpedErrands: builder.query<
      {
        errands: any[];
        summary: {
          totalEarned: number;
          totalCompleted: number;
          totalDisputed: number;
        };
      },
      { status?: ErrandStatus | ErrandStatus[] } | void
    >({
      query: (arg) => ({
        url: `user/helped-errands`,
        method: "GET",
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: [TAGS.HELPED_ERRANDS],
    }),
    getSettings: builder.query({
      query: () => "user/settings",
      providesTags: [TAGS.USER_SETTINGS],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({
        url: "user/update-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [TAGS.USER_SETTINGS],
    }),
    savePushToken: builder.mutation<void, string>({
      query: (token) => ({
        url: "user/push-token",
        method: "POST",
        body: { token },
      }),
    }),
    updateAvatar: builder.mutation<{ avatarUrl: string }, string>({
      query: (avatarUrl) => ({
        url: "user/avatar",
        method: "PATCH",
        body: { avatarUrl },
      }),
      invalidatesTags: [TAGS.USER],
    }),
    deleteAccount: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "user/me",
        method: "DELETE",
      }),
    }),
  }),
});

export { usersApi };

export const {
  useGetSettingsQuery,
  useGetUserDetailsQuery,
  useGetHelpedErrandsQuery,
  useUpdateSettingsMutation,
  useGetRequestedErrandsQuery,
  useSavePushTokenMutation,
  useUpdateAvatarMutation,
  useDeleteAccountMutation,
} = usersApi;
