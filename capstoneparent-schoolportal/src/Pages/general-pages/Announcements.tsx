import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { AnnouncementNavbar } from "@/components/staff/AnnouncementNavbar";
import { AnnouncementPostFeed } from "@/components/staff/AnnouncementPostFeed";
import { getAuthUser } from "@/lib/auth";
import { useAnnouncementPosts } from "@/hooks/useAnnouncementPosts";

export const Announcements = () => {
  const { posts } = useAnnouncementPosts("general");
  const authUser = getAuthUser();
  const normalizedRole = authUser?.role?.toLowerCase();
  const isStaffAnnouncementUser =
    normalizedRole === "admin" ||
    normalizedRole === "teacher" ||
    normalizedRole === "staff" ||
    normalizedRole === "principal";

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      {isStaffAnnouncementUser && <AnnouncementNavbar />}
      <AnnouncementPostFeed posts={posts} />
    </div>
  );

}