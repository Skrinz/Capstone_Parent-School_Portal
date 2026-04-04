export interface OrganizationalChartItem {
  id?: number;
  year: string;
  imageUrl: string;
  fileName?: string;
}

export const DEFAULT_ORGANIZATIONAL_CHARTS: OrganizationalChartItem[] = [];