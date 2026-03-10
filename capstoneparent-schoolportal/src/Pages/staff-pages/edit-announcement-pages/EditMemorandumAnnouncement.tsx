import { useState } from "react"
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar"
import { AnnouncementNavbar } from "@/components/staff/AnnouncementNavbar"
import { AnnouncementPostFeed, type AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal"
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal"
import { useAnnouncementPosts } from "@/hooks/useAnnouncementPosts"

export const EditMemorandumAnnouncement = () => {
	const { posts, createPost } = useAnnouncementPosts("memorandum")
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)

	const handleCreate = (data: {
		title: string
		content: string
		category: "general" | "staffs" | "memorandum"
	}) => {
		createPost(data)
	}

	const handleOpenEdit = (post: AnnouncementPostItem) => {
		console.log("Edit memorandum announcement:", post)
		setIsEditModalOpen(true)
	}

	return (
		<div className="min-h-screen bg-white">
			<RoleAwareNavbar />
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
