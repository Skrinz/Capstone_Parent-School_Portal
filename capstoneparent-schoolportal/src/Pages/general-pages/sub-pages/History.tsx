import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { getAuthUser } from "@/lib/auth";
import { getHistoryContent } from "@/lib/historyContent";
import { Pencil } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const HistoryImage = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <img
      src={imageUrl}
      alt="Pagsabungan Elementary School"
      className="w-full h-80 object-cover mb-8"
    />
  );
};

export const History = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin";
  const content = useMemo(() => getHistoryContent(), []);

  const principals = [
    { years: "1972 - 1979", name: "Mrs. Jacinta Sanchez" },
    { years: "1979 – 1983", name: "Mrs. Virginia Lobitania" },
    { years: "1983 – 1985", name: "Mrs. Geronima Acot" },
    { years: "1985 – 1987", name: "Dr. Enriquita Enriquez" },
    { years: "1987 – 1989", name: "Mrs. Meriam Dotosme" },
    { years: "1989 – 1991", name: "Mr. Paterno Belarma" },
    { years: "1991 – 2000", name: "Mrs. Ma. Dolores B. Banogon" },
    { years: "2000 – 2004", name: "Mrs. Lydia Tagalog" },
    { years: "2004 – 2006", name: "Mr. Raul M. Llego" },
    { years: "2006 – 2009", name: "Mrs. Corazon M. Yosores" },
    { years: "2009 - 2013", name: "Mr. Alejandro S. Lamdagan" },
    { years: "2013 – 2015", name: "Mrs. Mary Jean B. Codiñera" },
    { years: "2015 - 2017", name: "Mrs. Merinisa J. Olvido" },
    { years: "2017 – Present", name: "Mrs. Gemma H. Tangoan" },
  ];

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-center">{content.title}</h1>
          {isAdmin && (
            <Link
              to="/edithistory"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--button-green) text-white shadow-md transition-transform hover:scale-105"
              aria-label="Edit History"
            >
              <Pencil className="h-6 w-6" />
            </Link>
          )}
        </div>

        <HistoryImage imageUrl={content.imageUrl} />

        <div className="text-justify space-y-4 text-sm leading-relaxed">
          {content.body
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
        </div>

        <div className="mt-8">
          <table className="w-full text-sm">
            <tbody>
              {principals.map((principal, index) => (
                <tr key={index}>
                  <td className="py-2 px-2 w-1/4">{principal.years}</td>
                  <td className="py-2 px-2 w-3/4">{principal.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-b"></div>
      </div>
    </div>
  );
};
