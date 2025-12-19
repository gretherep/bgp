// app/models/businessInfo.ts
export interface BusinessInfo {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  updated_at: string;
}
