export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string; // <-- agregado
  created_at?: string;
  updated_at?: string;
}
