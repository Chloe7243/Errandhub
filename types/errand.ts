import { z } from "zod";

export type TaskType = "shopping" | "pickup";
export type Category = "quick" | "standard" | "complex";
export type ErrandStatus = "new" | "active" | "completed" | "cancelled";

export type Props = {
  type: Category;
  status: ErrandStatus;
  title: string;
  location: string;
  amount: string;
  time: string;
  helperFirstName?: string;
  helperLastName?: string;
  helperAvatar?: string;
  onPress?: () => void;
};

export const shoppingSchema = z.object({
  description: z.string().min(1, "Description is required"),
  store: z.string().min(1, "Store is required"),
  deliveryLocation: z.string().min(1, "Delivery location is required"),
  itemBudget: z.string().min(1, "Item budget is required"),
  helperPayment: z.string().min(1, "Helper payment is required"),
  allowSubstitution: z.boolean(),
});

export const pickupSchema = z.object({
  description: z.string().min(1, "Description is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  dropoffLocation: z.string().min(1, "Drop-off location is required"),
  pickupReference: z.string().optional(),
  helperPayment: z.string().min(1, "Helper payment is required"),
});

export type PickupForm = z.infer<typeof pickupSchema>;
export type ShoppingForm = z.infer<typeof shoppingSchema>;
