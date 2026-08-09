import React from 'react';
import { QueueInvoiceItem } from '../types';
import {
  ListOrdered,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface InvoiceQueueBarProps {
  queue: QueueInvoiceItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onResetQueue: () => void;
}

export const InvoiceQueueBar: React.FC<InvoiceQueueBarProps> = ({
  queue,
  activeIndex,
  onSelectIndex,
  onResetQueue,
}) => {
  if (queue.length === 0) return null;

  const total = queue.length;
  const savedCount = queue.filter((item) => item.status === 'saved').length;
  const pendingCount = total - savedCount;
  const isAllSaved = savedCount === total;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-slate-900 space-y-3">
      {/* Queue Header & Status Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded bg-blue-100 text-blue-700 border border-blue-200">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
                INDIVIDUAL INVOICE REVIEW QUEUE
              </h3>
              {total > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  BATCH OF {total} INVOICES
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {isAllSaved ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                  All {total} invoices reviewed and saved individually!
                </span>
              ) : (
                <span>
                  Currently reviewing invoice{' '}
                  <strong className="text-blue-700 font-bold font-mono">
                    {activeIndex + 1} of {total}
                  </strong>{' '}
                  ({pendingCount} remaining in review queue)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onResetQueue}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 transition flex items-center space-x-1.5"
            title="Clear Queue & Upload New Invoices"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Upload New Batch</span>
          </button>
        </div>
      </div>

      {/* Mandatory Sequential Rule Notice */}
      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-tight">
          <strong className="font-bold text-amber-950">Madam Lim's Verification Policy:</strong> Invoices must be reviewed and saved <strong>one by one, individually</strong>. Each invoice undergoes full PO/GRN matching, low-confidence audit checks, and duplicate detection before writing to Google Sheet.
        </div>
      </div>

      {/* Queue Items Horizontal Progress Track */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1">
        {queue.map((item, index) => {
          const isActive = index === activeIndex;
          const isSaved = item.status === 'saved';
          const invNo = item.extractedInvoice?.invoiceNumber || item.fileName;
          const supplier = item.extractedInvoice?.supplierName || 'Unknown Supplier';

          return (
            <button
              key={item.id}
              onClick={() => onSelectIndex(index)}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg border text-left transition shrink-0 min-w-[200px] max-w-[260px] relative ${
                isActive
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/50 shadow-sm'
                  : isSaved
                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {/* Status Icon */}
              <div className="shrink-0">
                {isSaved ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono text-xs font-bold animate-pulse">
                    {index + 1}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-mono text-xs font-bold">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="overflow-hidden flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 truncate" title={invNo}>
                    {invNo}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white">
                      ACTIVE
                    </span>
                  )}
                  {isSaved && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                      SAVED ✓
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate" title={supplier}>
                  {supplier}
                </p>
                <p className="text-[9px] text-slate-400 font-mono truncate" title={item.fileName}>
                  📄 {item.fileName}
                </p>
              </div>

              {index < total - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-1 hidden sm:block" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
