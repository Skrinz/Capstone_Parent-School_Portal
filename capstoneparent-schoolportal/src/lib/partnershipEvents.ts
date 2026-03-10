export interface PartnershipEventItem {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: number;
  imageUrl: string;
  dateLabel: string;
  location: string;
  organizer: string;
  audience: string;
  highlights: string[];
  details: string[];
  hashtags: string[];
}

export const partnershipEvents: PartnershipEventItem[] = [
  {
    id: 1,
    slug: "united-nations-day",
    title: "United Nations Day",
    subtitle: "#G1 Science Class",
    description:
      "On United Nations Day, learners explored books that celebrate global culture and community.",
    year: 2025,
    imageUrl:
      "https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "October 24, 2025",
    location: "School Library Hall",
    organizer: "Grade 1 Science Team and Library Unit",
    audience: "Grade 1 learners and parents",
    highlights: [
      "Culture-themed storytelling circles",
      "Flags and countries mini exhibit",
      "Parent-assisted reading stations",
    ],
    details: [
      "The school celebrated United Nations Day by introducing learners to books and stories from different countries. Students visited reading corners where each corner highlighted a region, its traditions, and simple cultural facts.",
      "Teachers and library staff facilitated short read-aloud sessions that focused on diversity, kindness, and global citizenship. Learners participated in sharing activities where they talked about what they learned from each story.",
      "The event ended with a reflection session where pupils expressed how understanding other cultures helps them become more respectful and open-minded community members.",
    ],
    hashtags: ["#UnitedNationsDay", "#GlobalCitizenship", "#ReadingCommunity"],
  },
  {
    id: 2,
    slug: "reading-month-celebration-2024",
    title: "Reading Month Celebration",
    subtitle: "Library Activity",
    description:
      "A month-long reading drive that encouraged storytelling, book sharing, and joyful literacy moments.",
    year: 2025,
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "November 2025",
    location: "School Grounds and Learning Resource Center",
    organizer: "School Reading Committee",
    audience: "All grade levels",
    highlights: [
      "Daily read-a-book challenge",
      "Storytelling and poem recitation",
      "Classroom mini-book fair",
    ],
    details: [
      "Reading Month Celebration created a school-wide habit of daily reading through class challenges and guided silent reading sessions. Learners were encouraged to read age-appropriate books and share key lessons with classmates.",
      "Teachers held storytelling blocks and reading buddy sessions where older pupils supported younger readers. This helped build confidence and improved oral reading fluency among participants.",
      "The culminating program featured class showcases, reading reflections, and recognition for active readers, reinforcing a positive and joyful reading culture in school.",
    ],
    hashtags: ["#ShareABook", "#ReadingMonthCelebration2024", "#ReadToLead"],
  },
  {
    id: 3,
    slug: "science-magic-ph",
    title: "Science Magic PH",
    subtitle: "Interactive Science Show",
    description:
      "Students experienced hands-on demonstrations that made science engaging, fun, and memorable.",
    year: 2025,
    imageUrl:
      "https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "August 15, 2025",
    location: "Multi-Purpose Hall",
    organizer: "Science Department and Partner Facilitators",
    audience: "Grades 3-6 learners",
    highlights: [
      "Live science demonstrations",
      "Interactive question rounds",
      "Simple experiment stations",
    ],
    details: [
      "Science Magic PH introduced science concepts through engaging demonstrations that connected classroom learning with real-world observations. Learners saw topics like force, pressure, and chemical reactions in action.",
      "The program encouraged curiosity through guided questioning and hands-on participation. Students were invited to predict outcomes before each demo, making learning active and memorable.",
      "Teachers documented learner reflections after the event and integrated follow-up activities into class discussions to reinforce understanding.",
    ],
    hashtags: ["#ScienceMagicPH", "#STEMLearning", "#HandsOnScience"],
  },
  {
    id: 4,
    slug: "career-day",
    title: "Career Day",
    subtitle: "Future Community Helpers",
    description:
      "Young learners visited the library in costume and discovered books connected to their dream careers.",
    year: 2024,
    imageUrl:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "September 10, 2024",
    location: "Library and Open Court",
    organizer: "Guidance Office and Class Advisers",
    audience: "Kinder to Grade 6 learners",
    highlights: [
      "Career costume parade",
      "Role-model story sharing",
      "Career-themed book browsing",
    ],
    details: [
      "Career Day helped learners connect their interests with future professions through storytelling, dress-up activities, and guided discussions about community roles.",
      "Each class visited curated reading stations featuring books about doctors, teachers, engineers, artists, and public servants. Learners practiced introducing themselves and sharing why they chose a specific career.",
      "Parents and teachers supported the activity by discussing the values and skills needed in each profession, reinforcing goal-setting at an early age.",
    ],
    hashtags: ["#CareerDay", "#FutureReadyLearners", "#DreamBig"],
  },
  {
    id: 5,
    slug: "area-vi-bsp-camp",
    title: "Area VI BSP Camp",
    subtitle: "School Partnership Event",
    description:
      "A collaborative scouting and values-driven activity that promoted teamwork and leadership.",
    year: 2024,
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "July 22-24, 2024",
    location: "Area VI Camp Grounds",
    organizer: "BSP Council and Partner Schools",
    audience: "Scouts from partner schools",
    highlights: [
      "Leadership games and team-building",
      "Values and discipline sessions",
      "Outdoor collaborative challenges",
    ],
    details: [
      "The Area VI BSP Camp gathered scouts from different schools for a three-day leadership and values formation program. Activities focused on teamwork, responsibility, and service.",
      "Participants completed collaborative tasks that required planning, communication, and problem-solving under guided supervision from BSP officers.",
      "The camp strengthened inter-school partnerships and gave learners opportunities to practice leadership in meaningful, community-oriented contexts.",
    ],
    hashtags: ["#BSPCamp", "#LeadershipInAction", "#SchoolPartnership"],
  },
  {
    id: 6,
    slug: "division-recognition",
    title: "Division Recognition",
    subtitle: "School Achievement",
    description:
      "Recognition of school and teacher accomplishments through division-level partnership programs.",
    year: 2023,
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "December 5, 2023",
    location: "Division Office Auditorium",
    organizer: "Schools Division Office",
    audience: "School heads, teachers, and staff",
    highlights: [
      "Awarding ceremony",
      "Best-practice sharing",
      "Partnership impact presentation",
    ],
    details: [
      "Division Recognition honored schools and educators for exemplary programs and collaborative achievements with stakeholders and partner organizations.",
      "The event highlighted innovation in instruction, literacy initiatives, and community engagement outcomes that positively affected learner performance.",
      "Awarded teams shared implementation strategies to help other schools replicate successful projects in their own contexts.",
    ],
    hashtags: ["#DivisionRecognition", "#SchoolExcellence", "#EducationPartnership"],
  },
  {
    id: 7,
    slug: "community-reading-outreach",
    title: "Community Reading Outreach",
    subtitle: "Barangay Program",
    description:
      "A reading outreach initiative that brought books and learning activities closer to families.",
    year: 2022,
    imageUrl:
      "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "June 18, 2022",
    location: "Partner Barangay Covered Court",
    organizer: "School Library Team and Barangay Council",
    audience: "Learners and families in partner barangays",
    highlights: [
      "Mobile reading corner",
      "Family read-aloud sessions",
      "Take-home activity kits",
    ],
    details: [
      "Community Reading Outreach extended literacy support beyond school walls by bringing books and reading sessions directly to neighborhood spaces.",
      "Families joined guided read-aloud activities, and volunteers demonstrated simple techniques parents can use to support reading at home.",
      "The outreach strengthened school-barangay collaboration and increased learner access to reading materials in underserved areas.",
    ],
    hashtags: ["#ReadingOutreach", "#BarangayPartnership", "#LiteracyForAll"],
  },
  {
    id: 8,
    slug: "book-donation-drive",
    title: "Book Donation Drive",
    subtitle: "Partner Organization",
    description:
      "Community and partner organizations donated books to strengthen learner access to resources.",
    year: 2021,
    imageUrl:
      "https://images.unsplash.com/photo-1455885666463-9a95b5f7c509?q=80&w=1887&auto=format&fit=crop",
    dateLabel: "March 27, 2021",
    location: "Learning Resource Center",
    organizer: "School PTA and Partner NGOs",
    audience: "All enrolled learners",
    highlights: [
      "Book turnover ceremony",
      "Cataloging and shelf expansion",
      "Volunteer-led reading orientation",
    ],
    details: [
      "The Book Donation Drive gathered support from families, alumni, and partner organizations to increase the school library's collection of learner-friendly titles.",
      "Library staff and volunteers sorted, categorized, and labeled donated resources to ensure quick access for classroom and independent reading use.",
      "This initiative expanded reading options for students and reinforced the role of community partnerships in sustaining quality learning resources.",
    ],
    hashtags: ["#BookDonationDrive", "#LibrarySupport", "#CommunityPartners"],
  },
];

export const getPartnershipEventBySlug = (slug: string) =>
  partnershipEvents.find((event) => event.slug === slug);
