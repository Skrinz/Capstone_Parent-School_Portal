import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed"

export type AnnouncementCategory = "general" | "staffs" | "memorandum"

interface AnnouncementPostStore {
  general: AnnouncementPostItem[]
  staffs: AnnouncementPostItem[]
  memorandum: AnnouncementPostItem[]
}

export interface CreateAnnouncementInput {
  title: string
  content: string
  category: AnnouncementCategory
}

const STORAGE_KEY = "portal_announcement_posts_v1"

const generalAnnouncementSeed: AnnouncementPostItem[] = [
  {
    id: "general-1",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 22, 2025",
    title: "Distribution of Learner's School Kits for SY 2025-2026",
    content:
      "We are pleased to announce that the school will begin the distribution of learner's school kits starting Wednesday, July 24, 2025, from 8:00 AM to 12:00 NN at the school covered court. Parents or guardians are requested to claim the kits on behalf of the students.\n\nPlease refer to the attached schedule indicating the grade levels and time slots for each section. Kindly bring your child's school ID or proof of enrolment for verification.\n\nThank you for your cooperation.",
    attachments: ["Kindergarten Schedule.pdf", "Grade 1 Schedule.pdf"],
  },
  {
    id: "general-2",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 22, 2025",
    title: "Reminder on School Grounds Clean-Up Drive",
    content:
      "All staff and homeroom officers are requested to support the clean-up drive this Friday, 3:00 PM onwards. Please coordinate with your grade-level chairperson for tools and designated zones.",
    attachments: ["Clean-Up Tasking.pdf"],
  },
]

const staffAnnouncementSeed: AnnouncementPostItem[] = [
  {
    id: "staff-1",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 22, 2025",
    title: "Staff Meeting for First Quarter Programs",
    content:
      "A mandatory staff meeting will be held on Monday, July 29, 2025 at 1:30 PM in the conference room. Agenda includes quarterly targets, student support initiatives, and committee updates.",
    attachments: ["Meeting Agenda.pdf"],
  },
  {
    id: "staff-2",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 20, 2025",
    title: "Submission of Weekly Accomplishment Report",
    content:
      "Please submit your weekly accomplishment report every Friday before 5:00 PM through the office email. Late submissions will be noted for monitoring.",
    attachments: ["Report Template.pdf"],
  },
]

const memorandumAnnouncementSeed: AnnouncementPostItem[] = [
  {
    id: "memo-1",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 18, 2025",
    title: "Memorandum No. 12 - Updated Dismissal Procedure",
    content:
      "Effective immediately, all grade-level advisers are instructed to strictly follow the updated dismissal release process. Parent pick-up verification must be completed prior to student release to ensure safety.",
    attachments: ["Memorandum-12.pdf", "Dismissal Flowchart.pdf"],
  },
  {
    id: "memo-2",
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: "July 15, 2025",
    title: "Memorandum No. 11 - Classroom Safety Compliance",
    content:
      "All advisers are required to complete the classroom safety checklist and submit signed copies to the school office not later than Wednesday, 4:00 PM.",
    attachments: ["Safety Checklist.pdf"],
  },
]

const getSeedPosts = (): AnnouncementPostStore => ({
  general: [...generalAnnouncementSeed],
  staffs: [...staffAnnouncementSeed],
  memorandum: [...memorandumAnnouncementSeed],
})

const getValidPosts = (value: unknown, fallback: AnnouncementPostItem[]) =>
  Array.isArray(value) ? (value as AnnouncementPostItem[]) : [...fallback]

const getCurrentDateLabel = () =>
  new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

const readStore = (): AnnouncementPostStore => {
  const seedPosts = getSeedPosts()

  if (typeof window === "undefined") {
    return seedPosts
  }

  const rawStore = window.localStorage.getItem(STORAGE_KEY)
  if (!rawStore) {
    return seedPosts
  }

  try {
    const parsedStore = JSON.parse(rawStore) as Partial<AnnouncementPostStore>
    return {
      general: getValidPosts(parsedStore.general, seedPosts.general),
      staffs: getValidPosts(parsedStore.staffs, seedPosts.staffs),
      memorandum: getValidPosts(parsedStore.memorandum, seedPosts.memorandum),
    }
  } catch {
    return seedPosts
  }
}

const writeStore = (store: AnnouncementPostStore) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export const getAnnouncementPosts = (category: AnnouncementCategory) => {
  const store = readStore()
  return store[category]
}

export const createAnnouncementPost = ({ title, content, category }: CreateAnnouncementInput) => {
  const store = readStore()
  const newPost: AnnouncementPostItem = {
    id: `${category}-${Date.now()}`,
    author: "LEDUVINA ANDRINO",
    role: "PRINCIPAL III",
    date: getCurrentDateLabel(),
    title,
    content,
    attachments: [],
  }

  store[category] = [newPost, ...store[category]]
  writeStore(store)
  return newPost
}
