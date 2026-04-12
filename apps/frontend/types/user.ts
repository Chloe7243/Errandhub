import { Role } from "@errandhub/shared";

export type User = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: Role;
  rating?: number;
  avatarUrl?: string | null;
};
