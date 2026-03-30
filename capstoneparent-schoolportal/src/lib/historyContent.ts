export interface HistoryContent {
  title: string;
  imageUrl: string;
  imageFileName?: string;
  body: string;
}

const STORAGE_KEY = "history-content";

const DEFAULT_BODY = `Pagsabungan Elementary School is situated in Z. Estreras St. Sector 7, Pagsabungan, Mandaue City. The area of the school site is 2, 427 sq. meters and it was donated by late barangay captain Sergio B. Toling. According to the locals, the barangay got its name from the word "sabong" (cockfighting) which the folks love to do in their leisure time.

The school was established in 1972. It started with only one building called the "MARCOS BUILDING" which catered the Grades One and Two. Mrs. Benilda P. Lapa was the first and lone teacher. She created the school organ named "the light-bringer". The school was supervised by the school principal of Basak Elementary School, Mrs. Jacinta Sanchez.

In 1976, Bagong Lipunan school building with 3 classrooms was constructed. Staff members/School personnel were added until all the grade levels were filled (Grade I- VI)

In 1978, the school produced the first batch of graduates composed of only a few pupils (approximately 17 pupils).

The Multipurpose H.E. building was built in 1980, followed by Bagong Lipunan building with 3 classrooms in 1983 (annex building) and a two-story building with 6 classrooms in the succeeding year to answer the needs of the growing population of the school.

As years go by, enrollment continues to rise. Numerous renovations and innovations were made. There are a lot of developments in the school like the presence of Aboitiz building that housed the five sections in Grade Six and one section in Grade V, the creation of an E-classroom, and the school library.

The school at present fosters and practice the vision of the Department of Education which states that "We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation. As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders" and live with the mission which states "To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education."`;

export const DEFAULT_HISTORY_CONTENT: HistoryContent = {
  title: "BRIEF HISTORY OF PAGSABUNGAN ELEMENTARY SCHOOL",
  imageUrl: "/History_Pic.jpg",
  imageFileName: "History_Pic.jpg",
  body: DEFAULT_BODY,
};

function getFileNameFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1] || "history-image";
}

function normalize(raw: Partial<HistoryContent> | null | undefined): HistoryContent {
  const imageUrl =
    typeof raw?.imageUrl === "string" && raw.imageUrl
      ? raw.imageUrl
      : DEFAULT_HISTORY_CONTENT.imageUrl;

  return {
    title:
      typeof raw?.title === "string" && raw.title
        ? raw.title
        : DEFAULT_HISTORY_CONTENT.title,
    imageUrl,
    imageFileName:
      typeof raw?.imageFileName === "string" && raw.imageFileName
        ? raw.imageFileName
        : getFileNameFromUrl(imageUrl),
    body:
      typeof raw?.body === "string" && raw.body
        ? raw.body
        : DEFAULT_HISTORY_CONTENT.body,
  };
}

export function getHistoryContent(): HistoryContent {
  if (typeof window === "undefined") {
    return DEFAULT_HISTORY_CONTENT;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_HISTORY_CONTENT),
      );
      return DEFAULT_HISTORY_CONTENT;
    }

    const parsed = JSON.parse(raw) as Partial<HistoryContent>;
    const normalized = normalize(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_HISTORY_CONTENT),
    );
    return DEFAULT_HISTORY_CONTENT;
  }
}

export function setHistoryContent(content: HistoryContent): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(content)));
}