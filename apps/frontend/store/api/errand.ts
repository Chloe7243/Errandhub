import { CreateErrandInput, ErrandStatus } from "@errandhub/shared";

type CreateErrandPayload = CreateErrandInput & { paymentMethodId: string };
import { api } from ".";
import { TAGS } from "@/utils/constants";

// Errand endpoints. Each mutation lists which cache tags it invalidates so
// the requester/helper list screens refetch automatically when a status
// changes or a new errand is posted.
const errandApi = api.injectEndpoints({
  endpoints: (build) => ({
    createErrand: build.mutation({
      query: (errandData: CreateErrandPayload) => ({
        url: `/errand/create`,
        method: "POST",
        body: errandData,
      }),
      invalidatesTags: [TAGS.REQUESTED_ERRANDS],
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

    updateErrandStatus: build.mutation({
      query: ({
        errandId,
        status,
        proofImageUrl,
        proofNote,
      }: {
        errandId: string;
        status: ErrandStatus;
        proofImageUrl?: string;
        proofNote?: string;
      }) => ({
        url: `/errand/${errandId}/status`,
        method: "PATCH",
        body: { status, proofImageUrl, proofNote },
      }),
      invalidatesTags: (result, error, { errandId }) => [
        TAGS.REQUESTED_ERRANDS,
        TAGS.HELPED_ERRANDS,
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),

    raiseDispute: build.mutation({
      query: ({ errandId, ...body }: { errandId: string; reason: string; explanation: string; evidenceImageUrl?: string }) => ({
        url: `/errand/${errandId}/dispute`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { errandId }) => [
        TAGS.REQUESTED_ERRANDS,
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),

startWork: build.mutation<{ errand: any }, string>({
      query: (errandId) => ({
        url: `/errand/${errandId}/start`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, errandId) => [
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),

    extendWork: build.mutation<
      { message: string; estimatedDuration: number },
      { errandId: string; additionalHours: number }
    >({
      query: ({ errandId, additionalHours }) => ({
        url: `/errand/${errandId}/extend`,
        method: "PATCH",
        body: { additionalHours },
      }),
      invalidatesTags: (result, error, { errandId }) => [
        { type: TAGS.ERRAND, id: errandId },
      ],
    }),
  }),
});

export const {
  useCreateErrandMutation,
  useGetErrandByIdQuery,
  useUpdateErrandStatusMutation,
  useRaiseDisputeMutation,
  useStartWorkMutation,
  useExtendWorkMutation,
} = errandApi;
