import { get, post, put, del } from "./api";
import type { Notification, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const notificationService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<Notification>> {
    return get<PaginatedResponse<Notification>>("/notifications", qs(params));
  },

  get(id: number): Promise<Notification> {
    return get<Notification>(`/notifications/${id}`);
  },

  create(data: Partial<Notification>): Promise<Notification> {
    return post<Notification>("/notifications", data);
  },

  update(id: number, data: Partial<Notification>): Promise<Notification> {
    return put<Notification>(`/notifications/${id}`, data);
  },

  delete(id: number): Promise<void> {
    return del<void>(`/notifications/${id}`);
  },

  nonLues(): Promise<Notification[]> {
    return get<Notification[]>("/notifications/non-lues");
  },

  lire(id: number): Promise<Notification> {
    return post<Notification>(`/notifications/${id}/lire`);
  },

  lireToutes(): Promise<{ message: string }> {
    return post<{ message: string }>("/notifications/lire-toutes");
  },
};
