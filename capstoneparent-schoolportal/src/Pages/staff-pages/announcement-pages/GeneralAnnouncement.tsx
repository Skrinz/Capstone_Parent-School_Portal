import { useState } from "react"
import { NavbarStaff } from "@/components/staff/NavbarStaff"
import { AnnouncementNavbar } from "@/components/staff/AnnouncementNavbar"
import { AnnouncementPostFeed, type AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal"
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal"

export const GeneralAnnouncement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const posts: AnnouncementPostItem[] = [
    {
      id: "general-1",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 22, 2025",
      title: "Distribution of Learner's School Kits for SY 2025-2026",
      content:
        "We are pleased to announce that the school will begin the distribution of learner's school kits starting Wednesday, July 24, 2025, from 8:00 AM to 12:00 NN at the school covered court. Parents or guardians are requested to claim the kits on behalf of the students.\n\nPlease refer to the attached schedule indicating the grade levels and time slots for each section. Kindly bring your child's school ID or proof of enrolment for verification.\n\nThank you for your cooperation.",
      attachments: ["Kindergarten Schedule.pdf", "Grade 1 Schedule.pdf"],
    },
    {
      id: "general-2",
      author: "LEDUVINA ANDRINO",
      role: "PRINCIPAL III",
      date: "July 22, 2025",
      title: "Reminder on School Grounds Clean-Up Drive",
      content:
        "All staff and homeroom officers are requested to support the clean-up drive this Friday, 3:00 PM onwards. Please coordinate with your grade-level chairperson for tools and designated zones.",
      attachments: ["Clean-Up Tasking.pdf"],
    },
  ];

  const handleCreate = (data: {
    title: string
    content: string
    category: "general" | "staffs" | "memorandum"
  }) => {
    console.log("Create general announcement:", data)
  }

  const handleOpenEdit = (post: AnnouncementPostItem) => {
    console.log("Edit general announcement:", post)
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