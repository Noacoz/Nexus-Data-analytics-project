import React, { useState } from 'react'
import API from '../../lib/api'

export default function DatasetUploadView({ onUpload, onCancel, pushToast }) {
  const [dragActive, setDragActive] = useState(false)
  const [fileObj, setFileObj] = useState(null)
  const [fileName, setFileName] = useState('')
  const [datasetName, setDatasetName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setFileObj(file)
      setFileName(file.name)
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileObj(file)
      setFileName(file.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fileObj || !datasetName) {
      if (pushToast) pushToast('Please select a file and enter a dataset name', 'error')
      return
    }

    const fileExt = fileName.split('.').pop().toUpperCase()
    const validFormats = ['CSV', 'JSON', 'PARQUET', 'XLSX', 'XLS', 'TSV', 'XML', 'SQL']
    if (!validFormats.includes(fileExt)) {
      if (pushToast) pushToast('Invalid file format. Supported: CSV, JSON, Parquet, Excel, TSV, XML, SQL', 'error')
      return
    }

    setUploading(true)
    try {
      // Create FormData for file upload
      const form = new FormData()
      form.append('file', fileObj)
      form.append('name', datasetName)
      form.append('description', description || 'No description provided')

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        credentials: 'include',
        body: form, // Do NOT set Content-Type — browser sets it with boundary automatically
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')

      if (pushToast) pushToast('Dataset uploaded successfully!', 'success')
      if (onUpload) onUpload(data.dataset)
    } catch (err) {
      if (pushToast) pushToast(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="w-full max-w-2xl">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold mb-2 text-center">Upload Dataset</h1>
        <p className="text-slate-400 text-center mb-12">Select a CSV, JSON, Parquet, or Excel file</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Drag Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-600/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="text-4xl mb-4">📤</div>
            <p className="text-xl font-semibold mb-2">Drag and drop your file</p>
            <p className="text-slate-400 mb-6">or</p>
            <label className="inline-block">
              <span className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer">
                Choose File
              </span>
              <input
                type="file"
                onChange={handleChange}
                accept=".csv,.json,.parquet,.xlsx,.xls,.tsv,.xml,.sql"
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-slate-400 mt-4">Maximum file size: 500 MB</p>
          </div>

          {fileName && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Selected file:</p>
              <p className="font-semibold text-indigo-400">{fileName}</p>
              {fileObj && <p className="text-xs text-slate-500 mt-1">{(fileObj.size / 1024).toFixed(2)} KB</p>}
            </div>
          )}

          {/* Dataset Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Dataset Name *</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              required
              placeholder="e.g., Customer Analytics Q1"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this dataset contains..."
              rows="4"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors resize-none"
              disabled={uploading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!fileObj || !datasetName || uploading}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '⏳ Uploading...' : 'Upload Dataset'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
