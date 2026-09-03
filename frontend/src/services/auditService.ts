import { get } from "./api";
import type { LogAudit, PaginatedResponse, PaginationParams } from "../types";

function qs(params: PaginationParams): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    per_page: params.per_page,
    search: params.search,
    sort: params.sort,
    order: params.order,
  };
}

export const auditService = {
  list(params: PaginationParams = {}): Promise<PaginatedResponse<LogAudit>> {
    return get<PaginatedResponse<LogAudit>>("/audit/logs", qs(params));
  },

  get(id: number): Promise<LogAudit> {
    return get<LogAudit>(`/audit/logs/${id}`);
  },

  parTable(table: string, params: PaginationParams = {}): Promise<PaginatedResponse<LogAudit>> {
    return get<PaginatedResponse<LogAudit>>(`/audit/logs/table/${table}`, qs(params));
  },

  parAction(action: string, params: PaginationParams = {}): Promise<PaginatedResponse<LogAudit>> {
    return get<PaginatedResponse<LogAudit>>(`/audit/logs/action/${action}`, qs(params));
  },

  parUtilisateur(utilisateurId: number, params: PaginationParams = {}): Promise<PaginatedResponse<LogAudit>> {
    return get<PaginatedResponse<LogAudit>>(`/audit/logs/utilisateur/${utilisateurId}`, qs(params));
  },

  statistiques(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/audit/statistiques");
  },
};
