import { apiFetch, bearerHeaders } from "./base";
import type { ContactUsContent } from "../contactUsContent";
import type { HistoryContent } from "../historyContent";
import type { TransparencyContent } from "../transparencyContent";
import type { SchoolCalendarItem } from "../schoolCalendarContent";
import type { OrganizationalChartItem } from "../organizationalChartContent";

export const pagesApi = {
  getContactUs: async (): Promise<ContactUsContent> => {
    return apiFetch<ContactUsContent>("/pages/contact-us");
  },
  updateContactUs: async (data: ContactUsContent): Promise<ContactUsContent> => {
    return apiFetch<ContactUsContent>("/pages/contact-us", {
      method: "PUT",
      headers: { 
        ...bearerHeaders(),
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data)
    });
  },
  
  getHistory: async (): Promise<HistoryContent> => {
    return apiFetch<HistoryContent>("/pages/history");
  },
  updateHistory: async (data: Partial<HistoryContent>, asset?: File): Promise<HistoryContent> => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.body) formData.append("body", data.body);
    if (asset) formData.append("asset", asset);
    
    return apiFetch<HistoryContent>("/pages/history", {
      method: "PUT",
      headers: bearerHeaders(),
      body: formData
    });
  },

  getTransparency: async (): Promise<TransparencyContent> => {
    return apiFetch<TransparencyContent>("/pages/transparency");
  },
  updateTransparency: async (asset?: File): Promise<TransparencyContent> => {
    const formData = new FormData();
    if (asset) formData.append("asset", asset);
    
    return apiFetch<TransparencyContent>("/pages/transparency", {
      method: "PUT",
      headers: bearerHeaders(),
      body: formData
    });
  },

  getSchoolCalendars: async (): Promise<SchoolCalendarItem[]> => {
    return apiFetch<SchoolCalendarItem[]>("/pages/school-calendar");
  },
  updateSchoolCalendar: async (data: Partial<SchoolCalendarItem>, asset?: File): Promise<SchoolCalendarItem> => {
    const formData = new FormData();
    if (data.year) formData.append("year", data.year);
    if (data.label) formData.append("label", data.label);
    if (asset) formData.append("asset", asset);
    
    return apiFetch<SchoolCalendarItem>("/pages/school-calendar", {
      method: "PUT",
      headers: bearerHeaders(),
      body: formData
    });
  },

  getOrgCharts: async (): Promise<OrganizationalChartItem[]> => {
    return apiFetch<OrganizationalChartItem[]>("/pages/org-chart");
  },

  /**
   * @param data        The updated chart data (including the new year value)
   * @param asset       Optional new image file
   * @param originalYear The year that was used to originally fetch this record.
   *                    Required when editing so the backend can find the right
   *                    row even if the year field itself was changed.
   */
  updateOrgChart: async (
    data: Partial<OrganizationalChartItem>,
    asset?: File,
    originalYear?: string,
  ): Promise<OrganizationalChartItem> => {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id.toString());
    if (data.year) formData.append("year", data.year);
    if (originalYear) formData.append("originalYear", originalYear);
    if (asset) formData.append("asset", asset);
    
    return apiFetch<OrganizationalChartItem>("/pages/org-chart", {
      method: "PUT",
      headers: bearerHeaders(),
      body: formData
    });
  },
};