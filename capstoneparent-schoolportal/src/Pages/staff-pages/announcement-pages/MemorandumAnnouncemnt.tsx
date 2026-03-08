import { useState } from "react"
import { NavbarStaff } from "@/components/staff/NavbarStaff"
import { AnnouncementNavbar } from "@/components/staff/AnnouncementNavbar"
import { AnnouncementPostFeed, type AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal"
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal"

export const MemorandumAnnouncement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const posts: AnnouncementPostItem[] = [
    {
      id: "memo-1",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 18, 2025",
      title: "Memorandum No. 12 - Updated Dismissal Procedure",
      content:
        "Effective immediately, all grade-level advisers are instructed to strictly follow the updated dismissal release process. Parent pick-up verification must be completed prior to student release to ensure safety.",
      attachments: ["Memorandum-12.pdf", "Dismissal Flowchart.pdf"],
    },
    {
      id: "memo-2",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 15, 2025",
      title: "Memorandum No. 11 - Classroom Safety Compliance",
      content:
        "All advisers are required to complete the classroom safety checklist and submit signed copies to the school office not later than Wednesday, 4:00 PM.",
      attachments: ["Safety Checklist.pdf"],
    },
  ];

  const handleCreate = (data: {
    title: string
    content: string
    category: "general" | "staffs" | "memorandum"
  }) => {
    console.log("Create memorandum announcement:", data)
  }

  const handleOpenEdit = (post: AnnouncementPostItem) => {
    console.log("Edit memorandum announcement:", post)
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