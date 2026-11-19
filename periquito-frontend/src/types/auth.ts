export const ROLE = {
  administrator: "Administrador",
  waiter: "Mesero",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: Role;
  };
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
}
