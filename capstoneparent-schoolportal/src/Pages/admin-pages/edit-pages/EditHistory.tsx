import { EditHistoryModal } from "@/components/admin/EditHistoryModal";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { useAboutUsStore } from "@/lib/store/aboutUsStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const EditHistory = () => {
	const navigate = useNavigate();
	const content = useAboutUsStore((state) => state.history);
	const isLoading = useAboutUsStore((state) => state.loading.history);
	const fetchHistory = useAboutUsStore((state) => state.fetchHistory);
	const updateHistory = useAboutUsStore((state) => state.updateHistory);

	useEffect(() => {
		fetchHistory().catch(() => undefined);
	}, [fetchHistory]);

	const handleClose = () => {
		navigate("/history");
	};

	const handleSave = async (updated: typeof content) => {
		await updateHistory(updated);
		navigate("/history");
	};

	const hasContent = Boolean(content.title || content.body || content.imageUrl);

	return (
		<div>
			<RoleAwareNavbar />
			<div className="mx-auto max-w-7xl px-4 py-10">
				{isLoading && !hasContent ? (
					<div className="p-8 text-center">Loading...</div>
				) : (
					<EditHistoryModal
						isOpen
						onClose={handleClose}
						initialContent={content}
						onSave={handleSave}
					/>
				)}
			</div>
		</div>
	);
};
