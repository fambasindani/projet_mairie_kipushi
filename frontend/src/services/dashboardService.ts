import { get } from "./api";
import type { DashboardGlobal, DashboardFinances } from "../types";

export const dashboardService = {
  global(): Promise<DashboardGlobal> {
    return get<DashboardGlobal>("/dashboard/global");
  },

  operateurs(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/dashboard/operateurs");
  },

  finances(): Promise<DashboardFinances> {
    return get<DashboardFinances>("/dashboard/finances");
  },

  taxes(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/dashboard/taxes");
  },

  activites(): Promise<Record<string, unknown>> {
    return get<Record<string, unknown>>("/dashboard/activites");
  },
};
