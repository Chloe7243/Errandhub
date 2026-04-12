import { CreateErrandInput, ErrandStatus } from "@errandhub/shared";
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
      providesTags: (result, error, errandId) => [
        { type: TAGS.ERRAND, id: errandId },
      ],
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
        offerAmount,
      }: {
        errandId: string;
        offerAmount: number;
      }) => ({
        url: `/errand/${errandId}/offers`,
        method: "POST",
        body: { amount: offerAmount },
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
    }),

    acceptOffer: build.mutation({
      query: ({
        errandId,
        offerId,
      }: {
        errandId: string;
        offerId: string;
      }) => ({
        url: `/errand/${errandId}/offers/${offerId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { errandId }) => [
        TAGS.REQUESTED_ERRANDS,
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),

    declineOffer: build.mutation({
      query: ({
        errandId,
        offerId,
      }: {
        errandId: string;
        offerId: string;
      }) => ({
        url: `/errand/${errandId}/offers/${offerId}/decline`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { errandId }) => [
        TAGS.REQUESTED_ERRANDS,
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),

    updateErrandStatus: build.mutation({
      query: ({
        errandId,
        status,
      }: {
        errandId: string;
        status: ErrandStatus;
      }) => ({
        url: `/errand/${errandId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { errandId }) => [
        TAGS.REQUESTED_ERRANDS,
        TAGS.HELPED_ERRANDS,
        { type: TAGS.ERRAND, id: errandId },
      ],
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
