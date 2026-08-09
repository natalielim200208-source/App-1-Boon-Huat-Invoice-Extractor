import React, { useState, useRef } from 'react';
import { ExtractedInvoice, QueueInvoiceItem } from '../types';
import { Upload, FileText, Loader2, AlertCircle, Files } from 'lucide-react';

interface InvoiceUploaderProps {
  onQueueCreated: (items: QueueInvoiceItem[]) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file '${file.name}' from disk.`));
    reader.readAsDataURL(file);
  });
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({
  onQueueCreated,
  isProcessing,
  setIsProcessing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMimeType = (file: File): string => {
    if (file.type && file.type.trim() !== '') {
      return file.type;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    return 'application/octet-stream';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(Array.from(e.target.files));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(Array.from(e.dataTransfer.files));
    }
  };

  const processFileList = async (files: File[]) => {
    setError(null);
    setIsProcessing(true);
    const queueItems: QueueInvoiceItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingProgress({
        current: i + 1,
        total: files.length,
        fileName: file.name,
      });

      try {
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File '${file.name}' exceeds 20MB limit. Please upload a smaller file.`);
        }

        const mimeType = getMimeType(file);
        const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isJpeg = mimeType === 'image/jpeg' || !!file.name.toLowerCase().match(/\.(jpe?g)$/i);
        const isPng = mimeType === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const isWebp = mimeType === 'image/webp' || file.name.toLowerCase().endsWith('.webp');

        if (!isPdf && !isJpeg && !isPng && !isWebp) {
          throw new Error(`File '${file.name}' is an unsupported format. Please upload JPEG, PNG, or PDF.`);
        }

        const base64Data = await readFileAsDataURL(file);

        const res = await fetch('/api/extract-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            mimeType,
            filename: file.name,
          }),
        });

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || `Failed to extract invoice data for '${file.name}'.`);
        }

        queueItems.push({
          id: `inv-${Date.now()}-${i}`,
          fileName: file.name,
          fileDataUrl: base64Data,
          fileType: isPdf ? 'pdf' : 'image',
          extractedInvoice: json.data,
          status: i === 0 ? 'active' : 'pending',
        });
      } catch (err: any) {
        console.error(`Error processing file ${file.name}:`, err);
        setError(`Failed to process '${file.name}': ${err.message || err}`);
      }
    }

    setIsProcessing(false);
    setProcessingProgress(null);

    if (queueItems.length > 0) {
      onQueueCreated(queueItems);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center">
          <Upload className="w-4 h-4 mr-2 text-blue-600" />
          UPLOAD SUPPLIER INVOICE(S)
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
          <Files className="w-3 h-3 text-blue-600" />
          MULTI-FILE QUEUE SUPPORTED
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition flex-1 flex flex-col items-center justify-center ${
            dragActive
              ? 'border-blue-600 bg-blue-50/50'
              : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {isProcessing ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {processingProgress
                    ? `Extracting Invoice ${processingProgress.current} of ${processingProgress.total}...`
                    : 'Extracting Invoice via AI Vision...'}
                </p>
                {processingProgress && (
                  <p className="text-xs font-mono font-bold text-blue-700 mt-1">
                    📄 {processingProgress.fileName}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Parsing line items, PO numbers, prices & confidence scores
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  <span className="text-blue-600 font-bold">Click to upload</span> or drag & drop single or multiple invoices
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports JPEG, PNG, or PDF files (Max 20MB per file)
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                  .JPEG
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                  .PNG
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                  .PDF
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
