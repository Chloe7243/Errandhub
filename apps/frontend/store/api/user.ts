import { ErrandStatus } from "@errandhub/shared";
import { api } from ".";
import { TAGS } from "@/utils/constants";

const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserDetails: builder.query({
      query: () => ({
        url: `user/me`,
        method: "GET",
      }),
      providesTags: [TAGS.USER],
    }),
    getRequestedErrands: builder.query({
      query: ({ status }: { status?: ErrandStatus | ErrandStatus[] }) => ({
        url: `user/requested-errands`,
        method: "GET",
        params: status ? { status } : undefined,
      }),
      providesTags: [TAGS.REQUESTED_ERRANDS],
    }),
    getHelpedErrands: builder.query({
      query: ({ status }: { status?: ErrandStatus | ErrandStatus[] }) => ({
        url: `user/helped-errands`,
        method: "GET",
        params: status ? { status } : undefined,
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
  }),
});

export const {
  useGetSettingsQuery,
  useGetUserDetailsQuery,
  useGetHelpedErrandsQuery,
  useUpdateSettingsMutation,
  useGetRequestedErrandsQuery,
} = usersApi;
