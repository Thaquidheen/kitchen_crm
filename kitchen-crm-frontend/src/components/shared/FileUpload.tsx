/**
 * FileUpload Component
 * Drag and drop file upload with react-dropzone
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import clsx from 'clsx';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FileUpload = ({
  onFilesSelected,
  accept,
  maxSize = 10485760, // 10MB default
  maxFiles = 1,
  multiple = false,
  disabled = false,
  className,
}: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragActive && !isDragReject && 'border-red-700 bg-red-700/10',
          isDragReject && 'border-red-500 bg-red-500/10',
          !isDragActive && 'border-black-600 hover:border-red-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          <Upload size={48} className={clsx(
            isDragActive ? 'text-red-700' : 'text-white-600'
          )} />

          {isDragActive ? (
            <p className="text-white-900 font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-white-900 font-medium">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-white-600">
                Maximum file size: {formatFileSize(maxSize)}
                {multiple && ` • Max files: ${maxFiles}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm font-medium text-red-400 mb-2">
            Some files were rejected:
          </p>
          <ul className="text-sm text-red-400 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name} - {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accepted Files */}
      {acceptedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-white-800">Selected files:</p>
          {acceptedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-3 bg-black-800 rounded-lg border border-black-600"
            >
              <File size={20} className="text-white-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-white-600">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
