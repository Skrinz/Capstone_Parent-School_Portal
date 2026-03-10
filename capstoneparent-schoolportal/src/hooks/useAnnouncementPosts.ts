import { useCallback, useEffect, useState } from "react"
import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import {
  createAnnouncementPost,
  getAnnouncementPosts,
  type AnnouncementCategory,
  type CreateAnnouncementInput,
} from "@/lib/announcementPosts"

export const useAnnouncementPosts = (category: AnnouncementCategory) => {
  const [posts, setPosts] = useState<AnnouncementPostItem[]>([])

  const reload = useCallback(() => {
    setPosts(getAnnouncementPosts(category))
  }, [category])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const handleStorage = () => {
      reload()
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [reload])

  const createPost = useCallback(
    (data: CreateAnnouncementInput) => {
      const createdPost = createAnnouncementPost(data)
      if (data.category === category) {
        reload()
      }
      return createdPost
    },
    [category, reload],
  )

  return {
    posts,
    createPost,
    reload,
  }
}
