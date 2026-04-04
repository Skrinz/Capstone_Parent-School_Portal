import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Loader } from "@/components/ui/Loader";
import { type ContactUsContent } from "@/lib/contactUsContent";
import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { pagesApi } from "@/lib/api/pagesApi";

export const EditContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ContactUsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    pagesApi
      .getContactUs()
      .then(setFormData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange =
    (field: keyof ContactUsContent) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) =>
        prev ? { ...prev, [field]: event.target.value } : prev,
      );
    };

  const handleSave = async () => {
    if (!formData) return;
    try {
      setIsSaving(true);
      await pagesApi.updateContactUs(formData);
      navigate("/contactus");
    } catch (error) {
      console.error("Failed to save", error);
      setIsSaving(false);
    }
  };

  return (
    <div>
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {isLoading || !formData ? (
          <Loader />
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-bold">Edit Contact us</h1>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-lg bg-[#e8e4b8] p-8 text-black">
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="principalOffice">
                      Principal's Office:
                    </label>
                    <input
                      id="principalOffice"
                      type="text"
                      value={formData.principalOffice}
                      onChange={handleChange("principalOffice")}
                      disabled={isSaving}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="libraryOffice">
                      Library Office:
                    </label>
                    <input
                      id="libraryOffice"
                      type="text"
                      value={formData.libraryOffice}
                      onChange={handleChange("libraryOffice")}
                      disabled={isSaving}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="facultyOffice">
                      Faculty Office:
                    </label>
                    <input
                      id="facultyOffice"
                      type="text"
                      value={formData.facultyOffice}
                      onChange={handleChange("facultyOffice")}
                      disabled={isSaving}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="facebookPageLabel">
                      Facebook Page Name:
                    </label>
                    <input
                      id="facebookPageLabel"
                      type="text"
                      value={formData.facebookPageLabel}
                      onChange={handleChange("facebookPageLabel")}
                      disabled={isSaving}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="facebookPageUrl">
                      Facebook Page URL:
                    </label>
                    <input
                      id="facebookPageUrl"
                      type="url"
                      value={formData.facebookPageUrl}
                      onChange={handleChange("facebookPageUrl")}
                      disabled={isSaving}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xl font-semibold" htmlFor="mapEmbedUrl">
                      Google Map Embed URL:
                    </label>
                    <textarea
                      id="mapEmbedUrl"
                      value={formData.mapEmbedUrl}
                      onChange={handleChange("mapEmbedUrl")}
                      rows={4}
                      disabled={isSaving}
                      className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="h-100 overflow-hidden rounded-lg shadow-lg md:h-auto">
                <iframe
                  src={formData.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pagsabungan Elementary School Location"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-(--button-green) px-6 py-3 text-3xl font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              >
                {isSaving && (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};