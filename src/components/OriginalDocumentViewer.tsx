import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FieldConfidence } from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  AlertTriangle,
  FileText,
  Eye,
  X,
  PenTool,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// Configure pdfjs worker using Vite local asset URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

interface OriginalDocumentViewerProps {
  documentUrl?: string | null;
  documentType?: 'image' | 'pdf';
  fileName?: string;
  confidences?: Record<string, FieldConfidence>;
  isHandwritten?: boolean;
  isLowQualityScan?: boolean;
  activeFieldFocus?: string | null;
}

// Convert data URL to Uint8Array for pdfjs
function dataURLtoUint8Array(dataUrl: string): Uint8Array | null {
  try {
    if (dataUrl.includes(';base64,')) {
      const base64 = dataUrl.split(';base64,')[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  } catch (err) {
    console.error('Error parsing PDF data URL:', err);
    return null;
  }
}

interface PdfCanvasViewerProps {
  documentUrl: string;
  zoom: number;
  rotation: number;
  isFullscreen?: boolean;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  documentUrl,
  zoom,
  rotation,
  isFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setPdfError(null);

    async function loadPdf() {
      try {
        let loadingTask;
        if (documentUrl.startsWith('data:')) {
          const bytes = dataURLtoUint8Array(documentUrl);
          if (bytes) {
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else {
            loadingTask = pdfjsLib.getDocument({ url: documentUrl });
          }
        } else {
          loadingTask = pdfjsLib.getDocument({ url: documentUrl });
        }

        const pdf = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to parse PDF via PDF.js:', err);
        if (!isCancelled) {
          setPdfError('Unable to render PDF preview canvas.');
          setLoading(false);
        }
      }
    }

    if (documentUrl) {
      loadPdf();
    }

    return () => {
      isCancelled = true;
    };
  }, [documentUrl]);

  // Render current PDF page onto canvas
  useEffect(() => {
    let isCancelled = false;
    if (!pdfDocument || !canvasRef.current) return;

    async function renderPage() {
      try {
        const page = await pdfDocument.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const baseScale = isFullscreen ? 1.5 : 1.2;
        const viewport = page.getViewport({ scale: baseScale * zoom, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering PDF page on canvas:', err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocument, currentPage, zoom, rotation, isFullscreen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-300 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-xs font-medium">Rendering PDF Document Canvas...</p>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="w-full flex flex-col items-center space-y-2">
        <div className="w-full h-[520px] bg-slate-800 rounded border border-slate-700 overflow-hidden shadow-2xl">
          <object
            data={documentUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <iframe
              src={documentUrl}
              title="PDF Preview"
              className="w-full h-full border-0"
            />
          </object>
        </div>
        <p className="text-[11px] text-slate-400 italic">Embedded PDF Viewer Fallback</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Page Navigation Bar for multi-page PDFs */}
      {numPages > 1 && (
        <div className="flex items-center space-x-2 bg-slate-800/90 text-white px-3 py-1.5 rounded-full border border-slate-700 text-xs font-mono shadow">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span>
            Page <strong className="text-blue-400">{currentPage}</strong> of {numPages}
          </span>

          <button
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
            className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas container */}
      <div className="overflow-auto max-w-full max-h-[600px] flex justify-center bg-white rounded shadow-2xl p-1 border border-slate-700">
        <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
      </div>
    </div>
  );
};

export const OriginalDocumentViewer: React.FC<OriginalDocumentViewerProps> = ({
  documentUrl,
  documentType = 'image',
  fileName = 'Original_Invoice_Scan.png',
  confidences = {},
  isHandwritten = false,
  activeFieldFocus = null,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // Identify low confidence fields
  const lowConfidenceFields: [string, FieldConfidence][] = Object.entries(confidences).filter(
    (entry): entry is [string, FieldConfidence] => (entry[1] as FieldConfidence)?.level === 'low'
  );

  const isPdf =
    documentType === 'pdf' ||
    (documentUrl && (documentUrl.includes('application/pdf') || documentUrl.endsWith('.pdf')));

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setHighlightedField(null);
  };

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Region highlighting mapping helper
  const getFieldHighlightBox = (field: string) => {
    switch (field) {
      case 'supplierName':
        return { top: '5%', left: '5%', width: '60%', height: '10%', label: 'Supplier Name Header' };
      case 'invoiceNumber':
        return { top: '14%', left: '60%', width: '35%', height: '8%', label: 'Invoice Number' };
      case 'invoiceDate':
        return { top: '14%', left: '55%', width: '40%', height: '10%', label: 'Invoice Date' };
      case 'poNumber':
        return { top: '20%', left: '55%', width: '40%', height: '8%', label: 'PO Reference' };
      case 'lineItems':
      case 'subtotal':
        return { top: '30%', left: '5%', width: '90%', height: '30%', label: 'Line Items & Breakdown' };
      case 'totalAmount':
        return { top: '48%', left: '50%', width: '45%', height: '12%', label: 'Total Amount Due' };
      default:
        return { top: '15%', left: '10%', width: '80%', height: '20%', label: 'Highlighted Region' };
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full text-slate-900">
        {/* Panel Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase truncate">
              ORIGINAL INVOICE DOCUMENT
            </h2>
            {isHandwritten && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <PenTool className="w-3 h-3 mr-1 text-purple-600" />
                Handwritten
              </span>
            )}
            {isPdf ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                PDF
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                SCAN IMAGE
              </span>
            )}
          </div>

          {/* Zoom & Control Toolbar */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded text-slate-700 transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded border border-slate-200 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded text-slate-700 transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRotate}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition"
              title="Reset Zoom & Orientation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-sm"
              title="Full Screen Viewer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Low Confidence Spotlight Alert Banner */}
        {lowConfidenceFields.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong className="font-bold">Visual Audit Alert:</strong> {lowConfidenceFields.length}{' '}
                field(s) flagged low confidence (faint/smudged).
              </span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {lowConfidenceFields.map(([f]) => (
                <button
                  key={f}
                  onClick={() => setHighlightedField(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    highlightedField === f
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                  }`}
                >
                  Locate {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Viewing Area */}
        <div className="relative flex-1 bg-slate-900/90 overflow-auto min-h-[420px] max-h-[650px] flex items-center justify-center p-4">
          {documentUrl ? (
            isPdf ? (
              <PdfCanvasViewer documentUrl={documentUrl} zoom={zoom} rotation={rotation} />
            ) : (
              <div
                className="relative transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={documentUrl}
                  alt={fileName || 'Original Supplier Invoice'}
                  className="max-w-full h-auto object-contain shadow-2xl rounded border border-slate-700 bg-white"
                  style={{ maxHeight: '600px' }}
                />

                {/* Interactive Low Confidence Highlight Overlay Boxes */}
                {lowConfidenceFields.map(([field, conf]) => {
                  const box = getFieldHighlightBox(field);
                  const isFocused = highlightedField === field || activeFieldFocus === field;

                  return (
                    <div
                      key={field}
                      onClick={() => setHighlightedField(field)}
                      style={{
                        position: 'absolute',
                        top: box.top,
                        left: box.left,
                        width: box.width,
                        height: box.height,
                      }}
                      className={`cursor-pointer border-2 rounded transition-all duration-300 z-10 ${
                        isFocused
                          ? 'border-red-500 bg-red-500/25 ring-4 ring-red-400/50 animate-pulse'
                          : 'border-amber-400 bg-amber-400/20 hover:border-amber-500 hover:bg-amber-400/30'
                      }`}
                      title={`${box.label}: ${conf.explanation || 'Low confidence field'}`}
                    >
                      <span className="absolute -top-6 left-0 bg-amber-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow uppercase tracking-wider whitespace-nowrap flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {field}: Low Confidence
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center p-8 text-slate-400 flex flex-col items-center justify-center space-y-2">
              <FileText className="w-12 h-12 text-slate-600" />
              <p className="text-sm font-medium">No original invoice document available.</p>
              <p className="text-xs text-slate-500">Upload an invoice to view the original document scan.</p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600 font-mono">
          <span className="truncate max-w-[250px] font-medium" title={fileName}>
            📄 {fileName}
          </span>
          <div className="flex items-center space-x-3 text-[10px] text-slate-500">
            <span>Use + / - to zoom</span>
            <span>•</span>
            <span>Click 'Locate' to pinpoint low confidence fields</span>
          </div>
        </div>
      </div>

      {/* Full Screen Lightbox Modal */}
      {isFullscreen && documentUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          {/* Modal Header Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-sm tracking-wide">FULL SCREEN INVOICE INSPECTOR</h3>
                <p className="text-xs text-slate-400 font-mono">{fileName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Toolbar */}
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-bold text-blue-400 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            {isPdf ? (
              <PdfCanvasViewer
                documentUrl={documentUrl}
                zoom={zoom}
                rotation={rotation}
                isFullscreen={true}
              />
            ) : (
              <div
                className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={documentUrl}
                  alt={fileName}
                  className="max-w-4xl max-h-[85vh] object-contain shadow-2xl rounded border border-slate-700 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
