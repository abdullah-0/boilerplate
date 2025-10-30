export type Credentials = {
  email: string;
  password: string;
};

export type RegisterPayload = Credentials & {
  first_name: string;
  last_name?: string;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string | null;
};

export type TokenResponse = {
  access: string;
  refresh: string;
  type: string;
};

export type AuthResponse = {
  user: User;
  token: TokenResponse;
};

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
