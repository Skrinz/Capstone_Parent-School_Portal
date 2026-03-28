import { useCallback, useEffect, useState } from "react"
import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import { getAnnouncements } from "@/lib/api/announcementsApi"
import type { AnnouncementCategory } from "@/lib/announcementPosts"

export const useAnnouncementPosts = (category: AnnouncementCategory) => {
  const [posts, setPosts] = useState<AnnouncementPostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getBackendType = (cat: AnnouncementCategory): "General" | "Staff_only" | "Memorandum" => {
    switch (cat) {
      case "general": return "General";
      case "staffs": return "Staff_only";
      case "memorandum": return "Memorandum";
      default: return "General";
    }
  };

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const type = getBackendType(category);
      const res = await getAnnouncements({ limit: 50, type });
      // Map data directly to state since backend field names match
      setPosts(res.data || []);
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    reload()
  }, [reload])

  // Temporarily return dummy create method or remove it later when implement create
  const createPost = useCallback(
    (data: any) => {
      console.warn("createPost is not fully hooked to backend yet");
      return null;
    },
    [],
  )

  return {
    posts,
    createPost,
    reload,
    isLoading,
  }
}

