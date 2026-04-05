// Download functions
export const downloadGradeSheetTemplate = async () => {
  try {
    const response = await fetch('/api/classes/grade-sheet-template', {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) throw new Error('Failed to download template');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade-sheet-template.csv`;
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
    });

    if (!response.ok) throw new Error('Failed to export grade sheet');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-${clist_id}-grades.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting grade sheet:', error);
    throw error;
  }
};

// Upload functions
export const uploadGradeSheet = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/classes/${clist_id}/import-grades`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upload grade sheet' }));
    throw new Error(error.message || 'Failed to upload grade sheet');
  }

  return await response.json();
};

export const uploadAttendanceSheet = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/classes/${clist_id}/import-attendance`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upload attendance' }));
    throw new Error(error.message || 'Failed to upload attendance');
  }

  return await response.json();
};

export const uploadClassSchedulePicture = async (clist_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/classes/${clist_id}/upload-schedule`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to upload class schedule');

  return await response.json();
};

export const uploadSubjectGradeSheet = async (srecord_id: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Note: Subject specific grade import might use a different endpoint or shared logic
  const response = await fetch(`/api/classes/subjects/${srecord_id}/import-grades`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to upload subject grade sheet');

  return await response.json();
};