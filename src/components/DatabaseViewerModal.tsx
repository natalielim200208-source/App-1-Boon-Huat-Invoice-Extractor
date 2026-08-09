import React, { useState } from 'react';
import { PurchaseOrder, GoodsReceivedNote } from '../types';
import { Database, FileCheck, PackageCheck, X, Search, RefreshCw } from 'lucide-react';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pos: PurchaseOrder[];
  grns: GoodsReceivedNote[];
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
  pos,
  grns,
  onRefresh,
  isRefreshing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'GRNS'>('POS');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPOs = pos.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGRNs = grns.filter(
    (grn) =>
      grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full p-6 shadow-xl text-slate-900 relative space-y-4 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                POs & GRNs REFERENCE DATABASE
              </h3>
              <p className="text-xs text-slate-500">
                Active records loaded from Google Sheets tabs used for 3-way matching
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              title="Fetch latest PO & GRN data from connected Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Live Sheet'}
            </button>
          )}
        </div>

        {/* Tab & Search controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded border border-slate-200 text-xs w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('POS')}
              className={`px-4 py-1.5 rounded font-bold uppercase tracking-wider transition flex items-center space-x-1.5 ${
                activeTab === 'POS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Purchase Orders ({pos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('GRNS')}
              className={`px-4 py-1.5 rounded font-bold uppercase tracking-wider transition flex items-center space-x-1.5 ${
                activeTab === 'GRNS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Goods Received Notes ({grns.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO / GRN / Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded bg-white">
          {activeTab === 'POS' ? (
            <table className="w-full text-left text-xs text-slate-900 border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">PO Date</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Qty Ordered</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Expected Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length > 0 ? (
                  filteredPOs.map((po) => (
                    <tr key={po.poNumber} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{po.poNumber}</td>
                      <td className="p-3 text-slate-600">{po.poDate}</td>
                      <td className="p-3 font-bold text-slate-900">{po.supplierName}</td>
                      <td className="p-3 text-slate-700">{po.itemDescription}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">{po.qtyOrdered}</td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ${(Number(po.unitPrice) || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        ${(Number(po.totalAmount) || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-600">{po.expectedDelivery}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      No Purchase Orders found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-900 border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3">GRN Number</th>
                  <th className="p-3">GRN Date</th>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Qty Ordered</th>
                  <th className="p-3 text-right">Qty Received</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGRNs.length > 0 ? (
                  filteredGRNs.map((grn) => (
                    <tr key={grn.grnNumber} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-700">{grn.grnNumber}</td>
                      <td className="p-3 text-slate-600">{grn.grnDate}</td>
                      <td className="p-3 font-mono text-blue-700">{grn.poNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{grn.supplierName}</td>
                      <td className="p-3 text-slate-700">{grn.itemDescription}</td>
                      <td className="p-3 text-right text-slate-600">{grn.qtyOrdered}</td>
                      <td
                        className={`p-3 text-right font-bold ${
                          grn.qtyReceived < grn.qtyOrdered ? 'text-amber-800' : 'text-emerald-700'
                        }`}
                      >
                        {grn.qtyReceived}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                            grn.condition.toLowerCase().includes('good')
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {grn.condition}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{grn.receivedBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      No Goods Received Notes found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
