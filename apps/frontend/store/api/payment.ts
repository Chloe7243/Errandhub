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

// Payment endpoints. getSetupIntent is a *mutation* (not a query) because
// each call issues a fresh Stripe SetupIntent client secret that is
// intended to be consumed once and then discarded.
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
