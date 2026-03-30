import { EditHistoryModal } from "@/components/admin/EditHistoryModal";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import {
	getHistoryContent,
	setHistoryContent,
	type HistoryContent,
} from "@/lib/historyContent";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const EditHistory = () => {
	const navigate = useNavigate();
	const content = useMemo(() => getHistoryContent(), []);

	const handleClose = () => {
		navigate("/history");
	};

	const handleSave = (updated: HistoryContent) => {
		setHistoryContent(updated);
		navigate("/history");
	};

	return (
		<div>
			<RoleAwareNavbar />
			<div className="mx-auto max-w-7xl px-4 py-10">
				<EditHistoryModal
					isOpen
					onClose={handleClose}
					initialContent={content}
					onSave={handleSave}
				/>
			</div>
		</div>
	);
};
