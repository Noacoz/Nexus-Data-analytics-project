/**
 * DataUpload Component
 * File upload with progress, status polling, and feedback
 */

import { useState, useRef } from "react";
import { useDataset } from "../hooks/useDataset";

export function DataUpload({ userId, onUploadComplete }) {
  const { upload, status, loading, error } = useDataset();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedFormats = [".csv", ".xlsx", ".xls", ".json"];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    const isValid = acceptedFormats.some((fmt) =>
      file.name.toLowerCase().endsWith(fmt)
    );

    if (!isValid) {
      alert(`Please upload: ${acceptedFormats.join(", ")}`);
      return;
    }

    try {
      const datasetId = await upload(file, userId);
      onUploadComplete?.(datasetId);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  if (loading && status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analysis Running...
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Your dataset is being processed. Computing statistics and generating insights.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Upload Failed
        </h3>
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-12-12l-4-4m0 0l-4 4m4-4v16"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Your Dataset
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your file, or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            click to browse
          </button>
        </p>

        <p className="text-sm text-gray-500">
          Supported formats: CSV, Excel, JSON (max 50MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">What Happens Next</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Your file is parsed and stored securely</li>
          <li>Statistical analysis is computed (means, correlations, etc.)</li>
          <li>AI generates insights with confidence scores</li>
          <li>Results available in real-time</li>
        </ol>
      </div>
    </div>
  );
}

export default DataUpload;
