import { apiFetch, bearerHeaders } from '@/lib/api/base';

const API_BASE_URL = '/api';

// Download student list template
export const downloadStudentListTemplate = async (fileType: 'csv' = 'csv') => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/student-list?format=${fileType}`, {
      method: 'GET',
      headers: bearerHeaders(),
    });

    if (!response.ok) throw new Error('Failed to download template');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-list-template.${fileType}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

// Upload student list
export const uploadStudentList = async (classId: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return await apiFetch(`/classes/${classId}/import-students`, {
      method: 'POST',
      headers: bearerHeaders(),
      successMessage: 'Student list uploaded successfully.',
      body: formData,
    });
  } catch (error) {
    console.error('Error uploading student list:', error);
    throw error;
  }
};
