import { Media } from "./media";

export type MediaCategory = Media["category"];
export interface PricingCategory {
  id: string;

  category: MediaCategory;
  price: number;
  currency: string;

  description: string | null;

  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}
