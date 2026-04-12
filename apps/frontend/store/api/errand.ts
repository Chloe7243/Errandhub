import { CreateErrandInput } from "@errandhub/shared";
import { api } from ".";
import { TAGS } from "@/utils/constants";

const errandApi = api.injectEndpoints({
  endpoints: (build) => ({
    createErrand: build.mutation({
      query: (errandData: CreateErrandInput) => ({
        url: `/errand/create`,
        method: "POST",
        body: errandData,
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    getPostedErrands: build.query({
      query: () => ({
        url: `/errand/posted`,
        method: "GET",
      }),
      providesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    getErrandById: build.query({
      query: (errandId: string) => ({
        url: `/errand/${errandId}`,
        method: "GET",
      }),
    }),

    acceptErrand: build.mutation({
      query: (errandId: string) => ({
        url: `/errand/${errandId}/accept`,
        method: "PATCH",
      }),
    }),

    submitOffer: build.mutation({
      query: ({
        errandId,
        bidAmount,
      }: {
        errandId: string;
        bidAmount: number;
      }) => ({
        url: `/errand/${errandId}/bids`,
        method: "POST",
        body: { amount: bidAmount },
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    acceptOffer: build.mutation({
      query: ({ errandId, bidId }: { errandId: string; bidId: string }) => ({
        url: `/errand/${errandId}/bids/${bidId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    declineOffer: build.mutation({
      query: ({ errandId, bidId }: { errandId: string; bidId: string }) => ({
        url: `/errand/${errandId}/bids/${bidId}/decline`,
        method: "PATCH",
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    updateErrandStatus: build.mutation({
      query: ({ errandId, status }) => ({
        url: `/errand/${errandId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS, TAGS.HELPED_ERRANDS],
    }),
  }),
});

export const {
  useCreateErrandMutation,
  useGetPostedErrandsQuery,
  useGetErrandByIdQuery,
  useSubmitOfferMutation,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
  useAcceptErrandMutation,
  useUpdateErrandStatusMutation,
} = errandApi;
