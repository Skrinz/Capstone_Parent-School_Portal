import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { AnnouncementPostFeed } from "@/components/staff/AnnouncementPostFeed";
import { getAuthUser } from "@/lib/auth";
import { useAnnouncementPosts } from "@/hooks/useAnnouncementPosts";
import { Navigate } from "react-router-dom";

export const Announcements = () => {
  const { posts } = useAnnouncementPosts("general");
  const authUser = getAuthUser();
  const normalizedRole = authUser?.role?.toLowerCase();
  const isAnnouncementEditor =
    normalizedRole === "admin" ||
    normalizedRole === "teacher" ||
    normalizedRole === "staff";

  if (isAnnouncementEditor) {
    return <Navigate to="/generalannouncement" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      <AnnouncementPostFeed posts={posts} />
    </div>
  );

}