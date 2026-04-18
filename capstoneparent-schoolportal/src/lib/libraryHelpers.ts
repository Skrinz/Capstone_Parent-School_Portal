export const GRADE_LEVELS = [
  { id: 1, label: "Kindergarten" },
  { id: 2, label: "Grade 1" },
  { id: 3, label: "Grade 2" },
  { id: 4, label: "Grade 3" },
  { id: 5, label: "Grade 4" },
  { id: 6, label: "Grade 5" },
  { id: 7, label: "Grade 6" },
];

export function formatGradeLevel(glId: number): string {
  const found = GRADE_LEVELS.find((grade) => grade.id === glId);
  return found ? found.label : `Grade ${glId}`;
}

export function getBadgeColorsForString(str: string | undefined | null): string {
  if (!str) return "bg-gray-100 text-gray-700";

  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-sky-100 text-sky-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-purple-100 text-purple-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
