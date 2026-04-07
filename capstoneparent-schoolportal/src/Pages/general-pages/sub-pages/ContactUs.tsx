import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { getAuthUser } from "@/lib/auth";
import { type ContactUsContent } from "@/lib/contactUsContent";
import { pagesApi } from "@/lib/api/pagesApi";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ContactUsSkeleton = ({ showEdit }: { showEdit: boolean }) => (
  <>
    <div className="mb-8 h-10 w-52 animate-pulse rounded bg-gray-200" />
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="rounded-lg bg-gray-200 p-8">
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-300/80" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-gray-300/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-100 animate-pulse rounded-lg bg-gray-200 md:h-auto" />
    </div>
    {showEdit && (
      <div className="mt-6 flex justify-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
      </div>
    )}
  </>
);

export const ContactUs = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin" || user?.role === "principal";
  const [content, setContent] = useState<ContactUsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    pagesApi
      .getContactUs()
      .then(setContent)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        {isLoading ? (
          <ContactUsSkeleton showEdit={isAdmin} />
        ) : !content ? (
          <p>No contact information available.</p>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-8">Contact us</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information Box */}
              <div className="bg-(--button-green) text-white p-8 rounded-lg">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Principal's Office:</h2>
                    <p className="text-lg">{content.principalOffice || "Not set"}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Library Office:</h2>
                    <p className="text-lg">{content.libraryOffice || "Not set"}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Faculty Office:</h2>
                    <p className="text-lg">{content.facultyOffice || "Not set"}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">Facebook Page:</h2>
                    {content.facebookPageUrl ? (
                      <a
                        href={content.facebookPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-300 text-lg hover:underline"
                      >
                        {content.facebookPageLabel || "Go to Page"}
                      </a>
                    ) : (
                      <p className="text-lg">Not set</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Map Box */}
              <div className="rounded-lg overflow-hidden shadow-lg h-100 md:h-auto">
                {content.mapEmbedUrl ? (
                  <iframe
                    src={content.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Pagsabungan Elementary School Location"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-200">
                    Map not set
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 flex justify-center">
                <Link
                  to="/editcontactus"
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105"
                  aria-label="Edit Contact Us"
                >
                  <Pencil className="h-8 w-8" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
