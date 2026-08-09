import React from 'react';
import { ExtractedInvoice, LineItem, FieldConfidence } from '../types';
import {
  Edit3,
  Plus,
  Trash2,
  AlertTriangle,
  Calculator,
  PenTool,
} from 'lucide-react';

interface ExtractionReviewTableProps {
  invoice: ExtractedInvoice;
  onChange: (updatedInvoice: ExtractedInvoice) => void;
}

export const ExtractionReviewTable: React.FC<ExtractionReviewTableProps> = ({
  invoice,
  onChange,
}) => {
  const updateField = (field: keyof ExtractedInvoice, value: any) => {
    onChange({
      ...invoice,
      [field]: value,
    });
  };

  const updateLineItem = (id: string, field: keyof LineItem, val: any) => {
    const updatedItems = invoice.lineItems.map((item) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(val) || 0 : item.quantity;
          const price = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
          newItem.lineTotal = Number((qty * price).toFixed(2));
        }
        return newItem;
      }
      return item;
    });

    recalculateTotals(updatedItems);
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: 'New Line Item',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
    };
    const updatedItems = [...invoice.lineItems, newItem];
    recalculateTotals(updatedItems);
  };

  const removeLineItem = (id: string) => {
    const updatedItems = invoice.lineItems.filter((item) => item.id !== id);
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items = invoice.lineItems) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const subtotalRounded = Number(subtotal.toFixed(2));
    const gst = Number((subtotalRounded * 0.09).toFixed(2)); // Standard 9% GST
    const totalAmount = Number((subtotalRounded + gst).toFixed(2));

    onChange({
      ...invoice,
      lineItems: items,
      subtotal: subtotalRounded,
      taxGst: gst,
      totalAmount: totalAmount,
    });
  };

  // Check if any field has low confidence
  const lowConfidenceFields = (
    Object.entries(invoice.confidences || {}).filter(
      ([_, conf]) => (conf as FieldConfidence)?.level === 'low'
    ) as [string, FieldConfidence][]
  );

  const getConfidenceBadge = (fieldName: string) => {
    const conf: FieldConfidence | undefined = invoice.confidences?.[fieldName];
    if (!conf) return null;

    if (conf.level === 'low') {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
          title={conf.explanation || 'Low confidence — please verify manually'}
        >
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
          Low confidence
        </span>
      );
    }

    if (conf.level === 'medium') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
          Verify
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden space-y-0 text-slate-900">
      {/* Table Header & Review Badge */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
              EXTRACTED DATA REVIEW & VERIFICATION
            </h2>
            {invoice.isHandwritten && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                <PenTool className="w-3 h-3 mr-1 text-purple-600" /> Handwritten Docket
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Madam Lim: Review & edit extracted invoice fields before saving to Invoice Log.
          </p>
        </div>

        <button
          onClick={() => recalculateTotals()}
          className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition shrink-0"
        >
          <Calculator className="w-3.5 h-3.5 mr-1.5" /> Recalculate Totals
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Distinct Handwritten Invoice Banner */}
        {invoice.isHandwritten && (
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg text-xs text-purple-900 flex items-start space-x-3 shadow-sm">
            <PenTool className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-purple-950 uppercase tracking-wide">
                Handwritten Docket / Invoice Detected
              </p>
              <p className="mt-1 leading-relaxed text-purple-900 font-medium">
                Handwritten invoice detected — extraction confidence is lower than typed invoices. Please verify all fields carefully before saving.
              </p>
            </div>
          </div>
        )}

        {/* Low Confidence Warning Box */}
        {lowConfidenceFields.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 uppercase tracking-wide">
                Low Confidence Fields Detected ({lowConfidenceFields.length})
              </p>
              <p className="mt-0.5 text-amber-800">
                Certain values on the invoice scan were faint or unreadable. Please check:
              </p>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-amber-800 font-medium">
                {lowConfidenceFields.map(([field, conf]) => (
                  <li key={field}>
                    <strong className="capitalize">{field}</strong>:{' '}
                    {conf.explanation || 'Unclear text on original scan'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Primary Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Supplier Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              {getConfidenceBadge('supplierName')}
            </div>
            <input
              type="text"
              value={invoice.supplierName}
              onChange={(e) => updateField('supplierName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="e.g. Tan Brothers Metal Works"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              {getConfidenceBadge('invoiceNumber')}
            </div>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={(e) => updateField('invoiceNumber', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono font-bold text-blue-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="e.g. INV-2026-001"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Invoice Date
              </label>
              {getConfidenceBadge('invoiceDate')}
            </div>
            <input
              type="text"
              value={invoice.invoiceDate}
              onChange={(e) => updateField('invoiceDate', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="YYYY-MM-DD"
            />
          </div>

          {/* PO Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                PO Reference
              </label>
              {getConfidenceBadge('poNumber')}
            </div>
            <input
              type="text"
              value={invoice.poNumber}
              onChange={(e) => updateField('poNumber', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono font-bold text-blue-600 underline bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="e.g. PO-2026-001"
            />
          </div>

          {/* Payment Due Date / Terms */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold block">
                Payment Due Date / Terms
              </label>
              {getConfidenceBadge('paymentDueDate')}
            </div>
            <input
              type="text"
              value={invoice.paymentDueDate || invoice.paymentTerms}
              onChange={(e) => updateField('paymentDueDate', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="e.g. 2026-08-31 or Net 30"
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Line Items ({invoice.lineItems.length})
            </h3>
            <button
              onClick={addLineItem}
              className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
            </button>
          </div>

          <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2 w-10 text-center">#</th>
                  <th className="px-4 py-2">Item Description</th>
                  <th className="px-4 py-2 w-24 text-right">Qty</th>
                  <th className="px-4 py-2 w-32 text-right">Unit Price</th>
                  <th className="px-4 py-2 w-32 text-right">Line Total</th>
                  <th className="px-4 py-2 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-slate-900 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right font-mono text-slate-900 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right font-mono text-slate-900 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                      ${(Number(item.lineTotal) || 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex flex-wrap justify-end pt-2 gap-6 border-t border-slate-200">
          <div className="text-right border-r border-slate-200 pr-6">
            <div className="flex items-center justify-end space-x-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Subtotal</p>
              {getConfidenceBadge('subtotal')}
            </div>
            <p className="text-lg font-mono font-medium text-slate-800">${(Number(invoice.subtotal) || 0).toFixed(2)}</p>
          </div>

          <div className="text-right border-r border-slate-200 pr-6">
            <div className="flex items-center justify-end space-x-1.5 mb-0.5">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Tax / GST</p>
              {getConfidenceBadge('taxGst')}
            </div>
            <div className="flex items-center justify-end space-x-1">
              <span className="text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                value={invoice.taxGst}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  const subtotal = Number(invoice.subtotal) || 0;
                  const newTotal = Number((subtotal + val).toFixed(2));
                  onChange({
                    ...invoice,
                    taxGst: val,
                    totalAmount: newTotal,
                    confidences: {
                      ...invoice.confidences,
                      taxGst: { level: 'high', explanation: 'Manually updated by reviewer' },
                    },
                  });
                }}
                className="w-24 px-2 py-0.5 text-right font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-600 text-base"
              />
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end space-x-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Amount Due</p>
              {getConfidenceBadge('totalAmount')}
            </div>
            <p className="text-2xl font-mono font-bold text-blue-700">
              ${(Number(invoice.totalAmount) || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
