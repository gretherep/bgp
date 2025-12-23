// app/models/businessInfo.ts
export interface BusinessInfo {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  price_basic: number | null;
  price_standard: number | null;
  price_premium: number | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  updated_at: string;
}
