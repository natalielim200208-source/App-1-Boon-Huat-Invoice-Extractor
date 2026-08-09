import React, { useState } from 'react';
import { InvoiceLogEntry } from '../types';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Eye,
  X,
  FileText,
  Trash2,
  Info,
} from 'lucide-react';
import { OriginalDocumentViewer } from './OriginalDocumentViewer';

interface InvoiceLogTableProps {
  entries: InvoiceLogEntry[];
  sheetId: string | null;
  isGoogleSheetActive: boolean;
  onClearInvoiceLog?: () => void;
}

export const InvoiceLogTable: React.FC<InvoiceLogTableProps> = ({
  entries,
  sheetId,
  isGoogleSheetActive,
  onClearInvoiceLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCHED' | 'PARTIAL' | 'NO_MATCH'>('ALL');
  const [selectedPreviewEntry, setSelectedPreviewEntry] = useState<InvoiceLogEntry | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.lineItemsSummary.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'MATCHED') return entry.matchStatus === 'Fully Matched';
    if (statusFilter === 'PARTIAL') return entry.matchStatus.includes('Partial');
    if (statusFilter === 'NO_MATCH') return entry.matchStatus.includes('No Match');

    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
              INVOICE LOG TAB (LIVE DATABASE)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of all reviewed supplier invoices feeding into 3-way matching and payment tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClearInvoiceLog && (
            <button
              type="button"
              onClick={() => setShowClearConfirmModal(true)}
              className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shrink-0 uppercase tracking-wider cursor-pointer"
              title="Clear the displayed log view (does not affect connected Google Sheet)"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              Clear Log ({entries.length} {entries.length === 1 ? 'row' : 'rows'})
            </button>
          )}
          {sheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 transition shrink-0 uppercase tracking-wider"
            >
              Open Live Google Sheet <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-emerald-600" />
            </a>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, supplier, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setStatusFilter('MATCHED')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition ${
                statusFilter === 'MATCHED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fully Matched
            </button>
            <button
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition ${
                statusFilter === 'PARTIAL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partial Match
            </button>
            <button
              onClick={() => setStatusFilter('NO_MATCH')}
              className={`px-3 py-1 rounded font-bold uppercase tracking-wider transition ${
                statusFilter === 'NO_MATCH'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              No Match
            </button>
          </div>
        </div>

        {/* Status Definition Notice */}
        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded text-xs text-blue-950 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">
            <strong className="font-bold text-blue-900">Initial Check Status:</strong> Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <th className="p-3">Source Scan</th>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">PO Number</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-right">GST</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Due Date</th>
                <th
                  className="p-3 cursor-help"
                  title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard."
                >
                  <div className="flex items-center space-x-1">
                    <span>Initial Check Status</span>
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="p-3">Reviewed By</th>
                <th className="p-3">Review Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => (
                  <tr key={`${entry.invoiceNumber}-${idx}`} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap">
                      {entry.documentUrl ? (
                        <button
                          onClick={() => setSelectedPreviewEntry(entry)}
                          className="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition"
                          title="Click to view original invoice scan image/PDF"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          View Document
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">No Scan</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700">{entry.invoiceNumber}</td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{entry.invoiceDate}</td>
                    <td className="p-3 font-bold text-slate-900">{entry.supplierName}</td>
                    <td className="p-3 font-mono text-blue-600">{entry.poNumber || '—'}</td>
                    <td className="p-3 max-w-[180px] truncate text-slate-700" title={entry.lineItemsSummary}>
                      {entry.lineItemsSummary}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">${(Number(entry.subtotal) || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-slate-700">${(Number(entry.gst) || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">
                      ${(Number(entry.totalAmount) || 0).toFixed(2)}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-700 font-medium">{entry.paymentDueDate}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          entry.matchStatus.includes('Duplicate')
                            ? 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-300'
                            : entry.matchStatus === 'Fully Matched'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : entry.matchStatus.includes('Partial')
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {entry.matchStatus.includes('Duplicate') ? (
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-purple-700" />
                        ) : entry.matchStatus === 'Fully Matched' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        ) : entry.matchStatus.includes('Partial') ? (
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 mr-1 text-red-600" />
                        )}
                        {entry.matchStatus}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-800 font-medium">
                      {entry.reviewedBy || 'Natalie Lim'}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {entry.reviewTimestamp || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-500 italic">
                    No invoices logged yet matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to view historical original invoice scan */}
      {selectedPreviewEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide uppercase">
                    HISTORICAL INVOICE DOCUMENT INSPECTOR
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Invoice #{selectedPreviewEntry.invoiceNumber} • {selectedPreviewEntry.supplierName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPreviewEntry(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Invoice Date</span>
                  <span className="font-bold text-slate-800">{selectedPreviewEntry.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">PO Number</span>
                  <span className="font-mono font-bold text-blue-600">{selectedPreviewEntry.poNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Billed</span>
                  <span className="font-mono font-bold text-blue-700">${selectedPreviewEntry.totalAmount?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block" title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.">Initial Check Status</span>
                  <span className="font-bold text-slate-800" title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.">{selectedPreviewEntry.matchStatus}</span>
                </div>
              </div>

              <OriginalDocumentViewer
                documentUrl={selectedPreviewEntry.documentUrl}
                documentType={selectedPreviewEntry.documentType || 'image'}
                fileName={selectedPreviewEntry.fileName || `${selectedPreviewEntry.invoiceNumber}.png`}
                isHandwritten={selectedPreviewEntry.isHandwritten}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPreviewEntry(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider rounded transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Displayed Log */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clear Displayed Log?</h3>
                  <p className="text-xs text-slate-500 font-medium">Invoice Log Tab View</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 mb-5 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">
                This won't affect the live Google Sheet.
              </p>
              <p className="text-slate-600">
                This action only clears the local table view in the app ({entries.length} {entries.length === 1 ? 'row' : 'rows'}).
                The actual records in your connected Google Sheet remain safe, untouched, and fully intact.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirmModal(false);
                  if (onClearInvoiceLog) {
                    onClearInvoiceLog();
                  }
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
              >
                Yes, Clear Displayed Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
