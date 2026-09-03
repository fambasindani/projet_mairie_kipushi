import { get, post } from "./api";
import type { LoginRequest, LoginResponse, Utilisateur } from "../types";

interface MeResponse {
  utilisateur: Utilisateur;
  roles?: { id: number; nom: string; permissions: string[] }[];
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const raw = await post<{ token: string; utilisateur: Utilisateur; roles?: unknown[] }>("/login", data);
    return { token: raw.token, utilisateur: raw.utilisateur };
  },

  logout(): Promise<void> {
    return post<void>("/logout");
  },

  async me(): Promise<Utilisateur> {
    const raw = await get<MeResponse>("/me");
    return raw.utilisateur;
  },

  changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<{ message: string }> {
    return post<{ message: string }>("/change-password", data);
  },
};
