import React from 'react';
import { InvoiceLogEntry } from '../types';
import { DATABASE_SHEET_NAME } from '../lib/googleSheets';
import { FileSpreadsheet, CheckCircle2, X, Loader2, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isDuplicateOverride?: boolean) => void;
  entry: InvoiceLogEntry;
  isSaving: boolean;
  isGoogleSheetActive: boolean;
  duplicateEntry?: InvoiceLogEntry | null;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  entry,
  isSaving,
  isGoogleSheetActive,
  duplicateEntry = null,
}) => {
  if (!isOpen) return null;

  const isDuplicate = !!duplicateEntry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 relative overflow-hidden">
        {/* Fixed Header */}
        <div className="p-5 pb-4 border-b border-slate-200 shrink-0 relative bg-slate-50/60">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title Header */}
          {isDuplicate ? (
            <div className="flex items-start space-x-3 pr-8">
              <div className="p-2.5 rounded bg-red-100 text-red-700 border border-red-200 shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 uppercase tracking-wide">
                  CRITICAL DUPLICATE INVOICE WARNING
                </h3>
                <p className="text-xs text-red-700 font-medium">
                  Save Operation Blocked — Requires Human Double-Check Confirmation
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 pr-8">
              <div className="p-2.5 rounded bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Confirm Entry & Save Record
                </h3>
                <p className="text-xs text-slate-500">
                  Madam Lim: Confirm writing this verified invoice row into{' '}
                  <span className="text-blue-700 font-bold font-mono">Invoice Log</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Vertically Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Risk-Based Mandatory Human Review Rationale Notice */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="leading-snug font-medium">
              <strong className="font-bold text-blue-900">Mandatory Human Sign-off Policy:</strong> Payments are irreversible and this business has previously suffered a $3,400 duplicate-payment error — Madam Lim's sign-off is required on every invoice before it is logged.
            </p>
          </div>

          {/* DUPLICATE WARNING BOX (Triggered when invoice exists in Invoice Log) */}
          {isDuplicate ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg space-y-2 text-xs text-red-900">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-bold text-sm leading-snug text-red-950">
                    This invoice ({entry.invoiceNumber} - {entry.supplierName}) already exists in the Invoice Log. A past incident led to a $3,400 overpayment from an unnoticed duplicate. Are you sure you want to save this again?
                  </p>
                </div>
              </div>

              {/* Existing Duplicate Record Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Existing Logged Record in Database:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-800">
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Invoice Number:</span>
                    <strong className="text-blue-700">{duplicateEntry.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Supplier:</span>
                    <strong className="text-slate-900">{duplicateEntry.supplierName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Previously Logged Date:</span>
                    <span>{duplicateEntry.invoiceDate || duplicateEntry.savedAt || 'Prior Record'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Recorded Total:</span>
                    <strong className="text-slate-900">${(Number(duplicateEntry.totalAmount) || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Audit Flagging:</strong> If saved anyway, this row will be recorded with Initial Check Status = <span className="font-mono font-bold text-amber-800 bg-amber-100 px-1 rounded">Duplicate — Confirmed Saved</span> for accounting review.
                </span>
              </div>
            </div>
          ) : (
            /* STANDARD ROW PAYLOAD PREVIEW */
            <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Row Payload (Columns 1 to 13 in exact order)
                </p>
                <span className="text-[10px] text-slate-500 italic bg-slate-200 px-2 py-0.5 rounded" title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.">
                  App 1 Preliminary Status
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">1. Invoice Number:</span>
                  <span className="font-mono font-bold text-blue-700">{entry.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">2. Invoice Date:</span>
                  <span className="text-slate-800 font-medium">{entry.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">3. Supplier Name:</span>
                  <span className="font-bold text-slate-900">{entry.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">4. PO Number:</span>
                  <span className="font-mono text-blue-600">{entry.poNumber || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">5. Line Items Summary:</span>
                  <span className="text-slate-800 font-medium">{entry.lineItemsSummary}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">6. Subtotal ($):</span>
                  <span className="font-mono text-slate-800">${(Number(entry.subtotal) || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">7. GST ($):</span>
                  <span className="font-mono text-slate-800">${(Number(entry.gst) || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">8. Total Amount ($):</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    ${(Number(entry.totalAmount) || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">9. Payment Due Date:</span>
                  <span className="text-slate-800 font-medium">{entry.paymentDueDate}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">10. Initial Check Status:</span>
                    <Info className="w-3 h-3 text-slate-400" title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard." />
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                      entry.matchStatus === 'Fully Matched'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : entry.matchStatus.includes('Partial')
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                    title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard."
                  >
                    {entry.matchStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">11. Reviewed By:</span>
                  <span className="font-semibold text-slate-900">{entry.reviewedBy || 'Natalie Lim (Madam Lim)'}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">12. Review Timestamp:</span>
                  <span className="font-mono text-slate-800">{entry.reviewTimestamp || new Date().toLocaleString()}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">13. Match / Review Notes:</span>
                  <span className="text-slate-800 italic font-medium">
                    {entry.manualNotes || (entry.matchStatus === 'Fully Matched' ? 'Verified & Approved' : entry.matchStatus)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isGoogleSheetActive
                ? `Target: Tab 'Invoice Log' in '${DATABASE_SHEET_NAME}'.`
                : 'Target: Local Browser Log State.'}
            </span>
          </div>
        </div>

        {/* Sticky/Fixed Bottom Action Buttons */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded transition uppercase tracking-wider"
          >
            {isDuplicate ? 'Cancel & Do Not Save' : 'Back & Modify'}
          </button>

          {isDuplicate ? (
            <button
              onClick={() => onConfirm(true)}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition shadow flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Flagged Duplicate...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Yes, Save Duplicate Anyway</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onConfirm(false)}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition shadow flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Writing Row...</span>
                </>
              ) : (
                <span>Confirm & Save to Invoice Log</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
