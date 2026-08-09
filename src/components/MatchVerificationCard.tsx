import React from 'react';
import { MatchCheckResult } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  PackageCheck,
  Info,
  CheckCircle2,
  XCircle,
  CopyCheck,
  Scale,
  Send,
  Sliders,
} from 'lucide-react';

interface MatchVerificationCardProps {
  matchResult: MatchCheckResult;
  manualNotes?: string;
  onUpdateManualNotes?: (notes: string) => void;
  onFlagProcurement?: (notes: string) => void;
}

export const MatchVerificationCard: React.FC<MatchVerificationCardProps> = ({
  matchResult,
  manualNotes = '',
  onUpdateManualNotes,
  onFlagProcurement,
}) => {
  const { matchStatus, flags, poFound, matchingPO, grnFound, matchingGRN, isDuplicate, priceTolerancePercent = 5.0 } =
    matchResult;

  const isNoMatch = matchStatus.includes('No Match');

  const getStatusBadge = () => {
    switch (matchStatus) {
      case 'Fully Matched':
        return (
          <div className="flex items-center space-x-2 bg-emerald-100 border border-emerald-200 px-4 py-2 rounded text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Fully Matched</p>
              <p className="text-[11px] text-emerald-700 font-medium">
                PO & GRN verified. Quantities & prices clean.
              </p>
            </div>
          </div>
        );
      case 'Partial Match — Review Needed':
        return (
          <div className="flex items-center space-x-2 bg-amber-100 border border-amber-200 px-4 py-2 rounded text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Partial Match — Review Needed</p>
              <p className="text-[11px] text-amber-800 font-medium">
                PO/GRN found, but price or quantity variance detected.
              </p>
            </div>
          </div>
        );
      case 'No Match — Manual Check Required':
      default:
        return (
          <div className="flex items-center space-x-2 bg-red-100 border border-red-200 px-4 py-2 rounded text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">No Match — Manual Check Required</p>
              <p className="text-[11px] text-red-800 font-medium">
                PO or GRN missing. Physical verification required.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900">
      {/* Header & Status */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center">
            <CopyCheck className="w-4 h-4 mr-2 text-blue-600" />
            3-WAY VERIFICATION ENGINE (PO & GRN CROSS-CHECK)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5" title="Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.">
            Initial Check Status: Automated first-pass check at time of upload — subject to re-verification in the Audit Dashboard.
          </p>
        </div>

        {getStatusBadge()}
      </div>

      <div className="p-6 space-y-5">
        {/* Fairness / Uniformity Statement */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 flex items-center space-x-2.5">
          <Scale className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="leading-snug">
            <strong className="font-bold text-slate-900">Match criteria applied uniformly:</strong> PO/GRN lookup and price/quantity variance thresholds, applied the same way regardless of supplier size or history.
          </span>
        </div>

        {/* Duplicate Invoice Warning ($3,400 Overpayment Protection) */}
        {isDuplicate && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-900 uppercase tracking-wide">
                CRITICAL DUPLICATE INVOICE WARNING ($3,400 Overpayment Protection)
              </p>
              <p className="mt-1 leading-relaxed text-red-800 font-medium">
                This invoice number and supplier combination already exists in the Invoice Log tab.
                A past incident led to an unnoticed $3,400 overpayment. Please verify if this invoice has already been paid!
              </p>
            </div>
          </div>
        )}

        {/* Plain Language Explanations Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Plain-Language Match Reasoning & Explanations
            </h3>
            <span className="inline-flex items-center text-[10px] font-mono font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
              <Sliders className="w-3 h-3 mr-1 text-slate-500" /> Tolerance Threshold: ±{priceTolerancePercent}%
            </span>
          </div>

          {flags.length > 0 ? (
            <ul className="space-y-1.5 text-xs">
              {flags.map((flag, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-slate-800 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold py-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                All 3-way checks passed cleanly: PO matched, GRN confirmed with good condition, no duplicate detected.
              </span>
            </div>
          )}
        </div>

        {/* Next-Step Action Panel for "No Match" or Manual Check */}
        {isNoMatch && (
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center">
                <Send className="w-4 h-4 mr-1.5 text-red-600" /> Next-Step Action: Manual Check Findings & Procurement Follow-up
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200 uppercase">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-700">
              Madam Lim: Record your findings or flag this missing PO/GRN to Procurement for follow-up instead of leaving it as an unresolved dead end.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => onUpdateManualNotes?.(e.target.value)}
                placeholder="e.g. Contacted supplier to request PO copy / Flagged to Procurement..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <button
                onClick={() => {
                  const flagText = manualNotes.trim() || 'Flagged to Procurement for follow-up on missing PO/GRN documentation.';
                  onUpdateManualNotes?.(flagText);
                  onFlagProcurement?.(flagText);
                }}
                className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded transition shrink-0 uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Flag to Procurement for Follow-up</span>
              </button>
            </div>
          </div>
        )}

        {/* Grid: PO Match vs GRN Match Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PO Cross-Check Panel */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <FileCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                1. Purchase Order (PO)
              </span>
              {poFound ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> PO Found
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="w-3 h-3 mr-1 text-red-600" /> PO Missing
                </span>
              )}
            </div>

            {matchingPO ? (
              <div className="text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">PO Number:</span>
                  <span className="font-mono font-bold text-blue-700">{matchingPO.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Supplier:</span>
                  <span className="font-semibold text-slate-900">{matchingPO.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Item Description:</span>
                  <span className="text-slate-800 truncate max-w-[180px]">{matchingPO.itemDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Qty Ordered:</span>
                  <span className="font-semibold text-slate-900">{matchingPO.qtyOrdered} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Unit Price:</span>
                  <span className="font-mono text-slate-900">${(Number(matchingPO.unitPrice) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">PO Total Amount:</span>
                  <span className="font-mono font-bold text-blue-700">${(Number(matchingPO.totalAmount) || 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-3">
                No matching PO record found in Purchase Orders (POs) database tab.
              </p>
            )}
          </div>

          {/* GRN Cross-Check Panel */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <PackageCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                2. Goods Received Note (GRN)
              </span>
              {grnFound ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> GRN Found
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="w-3 h-3 mr-1 text-red-600" /> GRN Missing
                </span>
              )}
            </div>

            {matchingGRN ? (
              <div className="text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">GRN Number:</span>
                  <span className="font-mono font-bold text-emerald-700">{matchingGRN.grnNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">GRN Date:</span>
                  <span className="text-slate-800 font-medium">{matchingGRN.grnDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Qty Received:</span>
                  <span
                    className={`font-semibold ${
                      matchingGRN.qtyReceived < matchingGRN.qtyOrdered
                        ? 'text-amber-800 font-bold'
                        : 'text-slate-900'
                    }`}
                  >
                    {matchingGRN.qtyReceived} / {matchingGRN.qtyOrdered} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Condition:</span>
                  <span
                    className={`font-bold truncate max-w-[170px] ${
                      matchingGRN.condition.toLowerCase().includes('good')
                        ? 'text-emerald-700'
                        : 'text-amber-800'
                    }`}
                    title={matchingGRN.condition}
                  >
                    {matchingGRN.condition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Received By:</span>
                  <span className="text-slate-800 font-medium">{matchingGRN.receivedBy}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-3">
                No Goods Received Note (GRN) logged for this PO yet. Do not approve payment until physical goods are verified.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
