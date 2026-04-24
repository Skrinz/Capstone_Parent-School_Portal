import {
  downloadStudentImportTemplate,
} from '@/lib/api/studentsApi';
import { classesApi } from '@/lib/api/classesApi';

// Download student list template
export const downloadStudentListTemplate = async () => {
  try {
    await downloadStudentImportTemplate();
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

// Upload student list
export const uploadStudentList = async (classId: number, file: File) => {
  try {
    return await classesApi.importStudents(classId, file);
  } catch (error) {
    console.error('Error uploading student list:', error);
    throw error;
  }
};
