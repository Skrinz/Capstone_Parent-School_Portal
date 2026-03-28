import { apiFetch, bearerHeaders } from "./base";
import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed";

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  type?: "General" | "Staff_only" | "Memorandum";
}

export interface AnnouncementsResponse {
  data: AnnouncementPostItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAnnouncements = (params?: GetAnnouncementsParams) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.type) searchParams.append("type", params.type);

  const query = searchParams.toString();
  const endpoint = query ? `/announcements?${query}` : `/announcements`;

  return apiFetch<AnnouncementsResponse>(endpoint, {
    method: "GET",
    headers: bearerHeaders(),
  });
};
