import { roleSelectionData } from "@errandhub/shared";
import { api } from ".";
import { TAGS } from "@/utils/constants";

const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserDetails: builder.query({
      query: ({ userId, role }: roleSelectionData) => ({
        url: `user/get`,
        method: "GET",
        params: { userId, role },
      }),
      providesTags: [TAGS.USER],
    }),
  }),
});

export const { useGetUserDetailsQuery } = usersApi;
