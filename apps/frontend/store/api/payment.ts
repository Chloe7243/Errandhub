import { api } from ".";
import { TAGS } from "@/utils/constants";

export type SavedCard = {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
};

const paymentApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSetupIntent: build.mutation<{ clientSecret: string }, void>({
      query: () => ({
        url: "/payment/setup-intent",
        method: "POST",
      }),
    }),

    getPaymentMethods: build.query<{ paymentMethods: SavedCard[] }, void>({
      query: () => ({ url: "/payment/methods", method: "GET" }),
      providesTags: [TAGS.PAYMENT_METHODS],
    }),

    deletePaymentMethod: build.mutation<{ message: string }, string>({
      query: (methodId) => ({
        url: `/payment/methods/${methodId}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.PAYMENT_METHODS],
    }),

  }),
});

export const {
  useGetSetupIntentMutation,
  useGetPaymentMethodsQuery,
  useDeletePaymentMethodMutation,
} = paymentApi;
