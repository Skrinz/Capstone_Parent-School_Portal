const STORAGE_KEY = 'librarianLibraryCategories';
const CHANGE_EVENT = 'librarian-library-categories-changed';

const DEFAULT_CATEGORIES = [
  'Mathematics',
  'Science',
  'Games',
  'History',
  'Sibika',
  'English',
  'Filipino',
  'Math',
  'Map',
  'Game',
  'Infographic',
];

const isBrowser = () => typeof window !== 'undefined';

const normalizeCategory = (category: string) => category.trim();

const uniqueCategories = (categories: string[]) => {
  const categoryMap = new Map<string, string>();
  categories.forEach((category) => {
    const normalized = normalizeCategory(category);
    if (!normalized) {
      return;
    }

    const lookupKey = normalized.toLowerCase();
    if (!categoryMap.has(lookupKey)) {
      categoryMap.set(lookupKey, normalized);
    }
  });

  return Array.from(categoryMap.values()).sort((left, right) => left.localeCompare(right));
};

const readStore = (): string[] => {
  if (!isBrowser()) {
    return uniqueCategories(DEFAULT_CATEGORIES);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaults = uniqueCategories(DEFAULT_CATEGORIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid categories payload');
    }

    const categories = uniqueCategories(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    return categories;
  } catch {
    const defaults = uniqueCategories(DEFAULT_CATEGORIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

const writeStore = (categories: string[]) => {
  if (!isBrowser()) {
    return;
  }

  const nextCategories = uniqueCategories(categories);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCategories));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const getLibraryCategories = () => readStore();

export const subscribeLibraryCategories = (listener: () => void) => {
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

export const addLibraryCategory = (categoryName: string) => {
  const categories = readStore();
  const normalizedCategory = normalizeCategory(categoryName);
  if (!normalizedCategory) {
    return false;
  }

  const alreadyExists = categories.some((category) => category.toLowerCase() === normalizedCategory.toLowerCase());
  if (alreadyExists) {
    return false;
  }

  writeStore([...categories, normalizedCategory]);
  return true;
};

export const updateLibraryCategory = (previousCategoryName: string, nextCategoryName: string) => {
  const categories = readStore();
  const normalizedNextCategory = normalizeCategory(nextCategoryName);
  if (!normalizedNextCategory) {
    return false;
  }

  const previousLookupKey = previousCategoryName.trim().toLowerCase();
  const nextLookupKey = normalizedNextCategory.toLowerCase();

  const previousCategoryExists = categories.some((category) => category.toLowerCase() === previousLookupKey);
  if (!previousCategoryExists) {
    return false;
  }

  const duplicateCategory = categories.some(
    (category) => category.toLowerCase() === nextLookupKey && category.toLowerCase() !== previousLookupKey,
  );
  if (duplicateCategory) {
    return false;
  }

  const nextCategories = categories.map((category) =>
    category.toLowerCase() === previousLookupKey ? normalizedNextCategory : category,
  );

  writeStore(nextCategories);
  return true;
};

export const deleteLibraryCategory = (categoryName: string) => {
  const categories = readStore();
  const lookupKey = categoryName.trim().toLowerCase();
  const nextCategories = categories.filter((category) => category.toLowerCase() !== lookupKey);

  if (nextCategories.length === categories.length) {
    return false;
  }

  writeStore(nextCategories);
  return true;
};
