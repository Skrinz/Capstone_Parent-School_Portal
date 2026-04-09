import { useEffect } from "react"
import type { AnnouncementCategory } from "@/lib/announcementPosts"
import { useAnnouncementStore } from "@/lib/store/announcementStore"

export const useAnnouncementPosts = (category: AnnouncementCategory) => {
  const posts = useAnnouncementStore((state) => state.postsByCategory[category])
  const isLoading = useAnnouncementStore(
    (state) => state.loadingByCategory[category],
  )
  const fetchPosts = useAnnouncementStore((state) => state.fetchPosts)
  const createPost = useAnnouncementStore((state) => state.createPost)
  const updatePost = useAnnouncementStore((state) => state.updatePost)

  useEffect(() => {
    fetchPosts(category).catch(() => undefined)
  }, [category, fetchPosts])

  return {
    posts,
    createPost,
    updatePost,
    reload: () => fetchPosts(category, true),
    isLoading,
  }
}

