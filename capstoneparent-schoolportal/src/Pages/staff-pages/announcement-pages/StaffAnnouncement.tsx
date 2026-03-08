import { useState } from "react"
import { NavbarStaff } from "@/components/staff/NavbarStaff"
import { AnnouncementNavbar } from "@/components/staff/AnnouncementNavbar"
import { AnnouncementPostFeed, type AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal"
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal"

export const StaffAnnouncement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const posts: AnnouncementPostItem[] = [
    {
      id: "staff-1",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 22, 2025",
      title: "Staff Meeting for First Quarter Programs",
      content:
        "A mandatory staff meeting will be held on Monday, July 29, 2025 at 1:30 PM in the conference room. Agenda includes quarterly targets, student support initiatives, and committee updates.",
      attachments: ["Meeting Agenda.pdf"],
    },
    {
      id: "staff-2",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 20, 2025",
      title: "Submission of Weekly Accomplishment Report",
      content:
        "Please submit your weekly accomplishment report every Friday before 5:00 PM through the office email. Late submissions will be noted for monitoring.",
      attachments: ["Report Template.pdf"],
    },
  ];

  const handleCreate = (data: {
    title: string
    content: string
    category: "general" | "staffs" | "memorandum"
  }) => {
    console.log("Create staff announcement:", data)
  }

  const handleOpenEdit = (post: AnnouncementPostItem) => {
    console.log("Edit staff announcement:", post)
    setIsEditModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <NavbarStaff />
      <AnnouncementNavbar />
      <AnnouncementPostFeed
        posts={posts}
        onAdd={() => setIsCreateModalOpen(true)}
        onEdit={handleOpenEdit}
      />

      <CreateAnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      <EditAnnouncementModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
        }}
      />
    </div>
  )
}