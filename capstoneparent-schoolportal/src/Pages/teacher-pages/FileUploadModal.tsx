import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title: string;
  acceptedFileTypes: string[]; // e.g., ['.xlsx', '.csv'] or ['.png', '.jpg', '.jpeg']
  maxSizeMB?: number;
}

export const FileUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title,
  acceptedFileTypes,
  maxSizeMB = 10,
}: FileUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Get file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    // Check if file type is accepted
    if (!acceptedFileTypes.includes(fileExtension)) {
      setError(
        `Unsupported file type. Please upload one of the following: ${acceptedFileTypes.join(', ')}`
      );
      setSelectedFile(null);
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds ${maxSizeMB}MB limit. Please select a smaller file.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-12 w-12 text-gray-400" />;
    
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const imageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    if (imageTypes.includes(fileExtension)) {
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    }
    return <FileText className="h-12 w-12 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">{title}</DialogTitle>
            <button
              onClick={handleClose}
              className="text-red-600 hover:text-red-700 transition-colors"
              disabled={isUploading}
            >
              <X className="h-8 w-8 font-bold" strokeWidth={3} />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Upload a file for {title.toLowerCase()}. Accepted file types are {acceptedFileTypes.join(', ')}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* File Input Button */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300"
              disabled={isUploading}
            >
              <Upload className="mr-2 h-5 w-5" />
              Select File
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Accepted formats: {acceptedFileTypes.join(', ')} (Max {maxSizeMB}MB)
            </p>
          </div>

          {/* Selected File Display */}
          <div className="min-h-[120px] bg-white border-2 border-gray-300 rounded-lg p-4">
            {selectedFile ? (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {selectedFile.type || 'Unknown'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="h-12 w-12 mb-2" />
                <p className="text-sm">No file selected</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
