import { EditOrganizationalChartModal } from "@/components/admin/EditOrganizationalChartModal";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Loader } from "@/components/ui/Loader";
import { getAuthUser } from "@/lib/auth";
import { type OrganizationalChartItem } from "@/lib/organizationalChartContent";
import { pagesApi } from "@/lib/api/pagesApi";
import { resolveMediaUrl } from "@/lib/api/base";
import { Pencil, Plus } from "lucide-react";
import { useState, useEffect } from "react";

const fabClassName =
  "inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--button-green)/40";

const ChartPreview = ({
  imageUrl,
  year,
}: {
  imageUrl: string;
  year: string;
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError || !imageUrl) {
    return (
      <div className="flex min-h-130 w-full items-center justify-center rounded-sm bg-white p-8 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-700">
            Chart file not found
          </p>
          <p className="mt-2 text-lg text-gray-600">
            School Year {year} has no organizational chart image uploaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolveMediaUrl(imageUrl)}
      alt={`Organizational Chart ${year}`}
      onError={() => setHasImageError(true)}
      className="h-auto w-full rounded-sm bg-white object-contain"
    />
  );
};

export const OrginizationalChart = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin" || user?.role === "principal";

  const [charts, setCharts] = useState<OrganizationalChartItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadCharts = () =>
    pagesApi.getOrgCharts().then((data) => {
      setCharts(data);
      if (data.length > 0) {
        setSelectedYear((prev) => {
          if (prev && data.some((c) => c.year === prev)) {
            return prev;
          }
          return data[0].year;
        });
      } else {
        setSelectedYear(null);
      }
    });

  useEffect(() => {
    loadCharts().catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const groupedCharts = charts.reduce((acc, chart) => {
    if (!acc[chart.year]) {
      acc[chart.year] = [];
    }
    acc[chart.year].push(chart);
    return acc;
  }, {} as Record<string, OrganizationalChartItem[]>);

  const uniqueYears = Object.keys(groupedCharts).sort((a, b) => b.localeCompare(a));
  const selectedYearCharts = selectedYear ? groupedCharts[selectedYear] : [];

  const handleAddOrgChart = async (
    chart: OrganizationalChartItem,
    file?: File,
  ) => {
    try {
      await pagesApi.updateOrgChart(chart, file);
      await loadCharts();
      setAddModalOpen(false);
    } catch (error) {
      console.error("Failed to save organizational chart", error);
      throw error;
    }
  };

  const handleEditOrgChart = async (
    chart: OrganizationalChartItem,
    file?: File,
  ) => {
    try {
      await pagesApi.updateOrgChart(
        chart,
        file,
        selectedYearCharts.find((c) => c.id === (chart.id || selectedChartId))?.year,
      );
      await loadCharts();
      setEditModalOpen(false);
      setSelectedChartId(null);
    } catch (error) {
      console.error("Failed to save organizational chart", error);
      throw error; // Re-throw so modal can catch and display
    }
  };

  return (
    <div>
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <Loader />
        ) : uniqueYears.length === 0 ? (
          <>
            <h1 className="mb-8 text-4xl font-bold">Organizational Chart</h1>
            <p>No organizational chart data available.</p>
            {isAdmin && (
              <div className="fixed bottom-8 right-8 flex flex-col gap-3">
                <button
                  type="button"
                  className={fabClassName}
                  onClick={() => setAddModalOpen(true)}
                  aria-label="Add organizational chart"
                >
                  <Plus className="h-10 w-10" />
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-8">Organizational Chart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="w-full rounded-sm bg-gray-300 p-8 space-y-8">
                  {selectedYearCharts.map((chart, index) => (
                    <div key={index} className="space-y-4">
                      <ChartPreview
                        imageUrl={chart.imageUrl}
                        year={chart.year}
                      />
                      {selectedYearCharts.length > 1 && (
                        <p className="text-center font-medium text-gray-700 italic">
                          File: {chart.fileName || `Chart ${index + 1}`}
                        </p>
                      )}
                      {isAdmin && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChartId(chart.id || null);
                              setEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-gray-100 px-3 py-1 text-sm font-medium hover:bg-gray-200 transition"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit this file
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center font-bold mt-4">
                  School Year {selectedYear}
                </p>
              </div>

              <div className="lg:col-span-1 flex lg:block lg:w-full w-fit mx-auto">
                <div className="w-full">
                  <h3 className="font-bold text-lg mb-4">Year</h3>
                  <div className="space-y-2">
                    {uniqueYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setSelectedYear(year)}
                        className={`block w-full text-left py-2 px-3 rounded transition ${
                          selectedYear === year
                            ? "bg-blue-500 text-white font-semibold"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="fixed bottom-8 right-8 flex flex-col gap-3">
                <button
                  type="button"
                  className={fabClassName}
                  onClick={() => setAddModalOpen(true)}
                  aria-label="Add organizational chart"
                >
                  <Plus className="h-10 w-10" />
                </button>
                {selectedYearCharts.length > 0 && (
                  <button
                    type="button"
                    className={fabClassName}
                    onClick={() => setEditModalOpen(true)}
                    aria-label="Edit organizational chart"
                  >
                    <Pencil className="h-10 w-10" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {isAdmin && (
          <EditOrganizationalChartModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            mode="add"
            charts={charts}
            onSave={handleAddOrgChart}
          />
        )}
        {isAdmin && selectedYear && selectedYearCharts.length > 0 && (
          <EditOrganizationalChartModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedChartId(null);
            }}
            mode="edit"
            charts={charts}
            editYear={selectedYear}
            editChartId={selectedChartId || undefined}
            onSave={handleEditOrgChart}
          />
        )}
      </div>
    </div>
  );
};