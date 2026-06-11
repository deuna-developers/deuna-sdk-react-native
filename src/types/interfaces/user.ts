export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  identity_document: string;
  identity_providers: Identityprovider[];
  is_phone_verified: boolean;
  is_guest: boolean;
}

interface Identityprovider {
  id: number;
  provider_name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
