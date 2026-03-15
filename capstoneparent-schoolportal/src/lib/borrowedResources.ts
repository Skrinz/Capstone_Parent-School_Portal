export type CopyStatus = 'BORROWED' | 'AVAILABLE' | 'LOST' | 'GIVEN';

export interface BorrowedResourceItem {
  id: string;
  title: string;
  borrower: string;
  section: string;
  subject: string;
  gradeLevel: string;
  status: CopyStatus;
  borrowedDate: string;
  borrowedTime: string;
  dueDate?: string;
  isOverdue?: boolean;
}

const STORAGE_KEY = 'librarianBorrowedResources';
const CHANGE_EVENT = 'librarian-borrowed-resources-changed';

const DEFAULT_BORROWED_ITEMS: BorrowedResourceItem[] = [
  {
    id: 'book:The New Science Links:2',
    title: 'The New Science Links 2',
    borrower: 'Pedro Parker',
    section: 'Daisy',
    subject: 'Science',
    gradeLevel: 'Grade 2',
    status: 'BORROWED',
    borrowedDate: '04/02/25',
    borrowedTime: '10:00 AM',
    dueDate: '04/09/25 10:00 AM',
  },
  {
    id: 'book:The New Science Links:3',
    title: 'The New Science Links 3',
    borrower: 'Bill Nye',
    section: 'Orchid',
    subject: 'Science',
    gradeLevel: 'Grade 3',
    status: 'BORROWED',
    borrowedDate: '03/31/25',
    borrowedTime: '01:15 PM',
    dueDate: '04/05/25 10:00 PM',
    isOverdue: true,
  },
  {
    id: 'learning-resource:Learning Resource:2',
    title: 'Learning Resource 2',
    borrower: 'Pedro Parker',
    section: 'Daisy',
    subject: 'Science',
    gradeLevel: 'Grade 2',
    status: 'BORROWED',
    borrowedDate: '04/02/25',
    borrowedTime: '10:00 AM',
    dueDate: '04/09/25 10:00 AM',
  },
  {
    id: 'learning-resource:Learning Resource:3',
    title: 'Learning Resource 3',
    borrower: 'Bill Nye',
    section: 'Orchid',
    subject: 'Science',
    gradeLevel: 'Grade 3',
    status: 'BORROWED',
    borrowedDate: '03/31/25',
    borrowedTime: '01:15 PM',
    dueDate: '04/05/25 10:00 PM',
    isOverdue: true,
  },
];

const isBrowser = () => typeof window !== 'undefined';

const readStore = (): BorrowedResourceItem[] => {
  if (!isBrowser()) {
    return DEFAULT_BORROWED_ITEMS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BORROWED_ITEMS));
    return DEFAULT_BORROWED_ITEMS;
  }

  try {
    const parsed = JSON.parse(raw) as BorrowedResourceItem[];
    return Array.isArray(parsed) ? parsed : DEFAULT_BORROWED_ITEMS;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BORROWED_ITEMS));
    return DEFAULT_BORROWED_ITEMS;
  }
};

const writeStore = (items: BorrowedResourceItem[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const getBorrowedResources = () => readStore();

export const subscribeBorrowedResources = (listener: () => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
};

export const setBorrowedResourceStatus = (
  item: BorrowedResourceItem,
  status: CopyStatus,
) => {
  const currentItems = readStore();

  if (status !== 'BORROWED') {
    writeStore(currentItems.filter((resourceItem) => resourceItem.id !== item.id));
    return;
  }

  const normalizedItem: BorrowedResourceItem = {
    ...item,
    status: 'BORROWED',
  };

  const existingIndex = currentItems.findIndex((resourceItem) => resourceItem.id === normalizedItem.id);
  if (existingIndex >= 0) {
    const nextItems = [...currentItems];
    nextItems[existingIndex] = normalizedItem;
    writeStore(nextItems);
    return;
  }

  writeStore([...currentItems, normalizedItem]);
};
