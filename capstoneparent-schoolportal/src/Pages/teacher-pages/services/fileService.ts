import { apiFetch, bearerHeaders } from '@/lib/api/base';

// Download functions
export const downloadGradeSheetTemplate = async () => {
  try {
    const response = await fetch('/api/classes/grade-sheet-template', {
      method: 'GET',
      headers: {
        ...bearerHeaders(),
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) throw new Error('Failed to download template');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grade Template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

export const downloadAttendanceTemplate = async () => {
  try {
    const response = await fetch('/api/classes/attendance-template', {
      method: 'GET',
      headers: {
        ...bearerHeaders(),
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) throw new Error('Failed to download template');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

export const exportAllQuartersGradeSheet = async (clist_id: number) => {
  try {
    const response = await fetch(`/api/classes/${clist_id}/export-grades-all-quarters`, {
      method: 'GET',
      headers: bearerHeaders(),
    });

    if (!response.ok) throw new Error('Failed to export grade sheet');

    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename[^;=\n]*=([^;\n"]+|"[^"\n]*")/);
    const fileName = match
      ? match[1].replace(/"/g, '').trim()
      : `class-${clist_id}-quarterly-grades.zip`;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting grade sheet:', error);
    throw error;
  }
};

export const exportStudentQuarterlyGrades = async (studentId: number, fallbackName?: string) => {
  try {
    const response = await fetch(`/api/students/${studentId}/export-grades`, {
      method: 'GET',
      headers: bearerHeaders(),
    });

    if (!response.ok) throw new Error('Failed to export student grades');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackName ?? `student-${studentId}-ReportCard.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting student grades:', error);
    throw error;
  }
};

// Upload functions
export const uploadGradeSheet = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch(`/classes/${clist_id}/import-grades`, {
    method: 'POST',
    successMessage: 'Grade sheet uploaded successfully.',
    headers: bearerHeaders(),
    body: formData,
  });
};

export const uploadAttendanceSheet = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch(`/classes/${clist_id}/import-attendance`, {
    method: 'POST',
    successMessage: 'Attendance sheet uploaded successfully.',
    headers: bearerHeaders(),
    body: formData,
  });
};

export const uploadClassSchedulePicture = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch(`/classes/${clist_id}/upload-schedule`, {
    method: 'POST',
    successMessage: 'Class schedule uploaded successfully.',
    headers: bearerHeaders(),
    body: formData,
  });
};

export const uploadSubjectGradeSheet = async (srecord_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Note: Subject specific grade import might use a different endpoint or shared logic
  return apiFetch(`/classes/subjects/${srecord_id}/import-grades`, {
    method: 'POST',
    successMessage: 'Grade sheet uploaded successfully.',
    headers: bearerHeaders(),
    body: formData,
  });
};