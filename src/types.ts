export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FieldConfidence {
  level: ConfidenceLevel;
  explanation?: string;
}

export interface QueueInvoiceItem {
  id: string;
  fileName: string;
  fileDataUrl: string;
  fileType: 'image' | 'pdf';
  extractedInvoice: ExtractedInvoice;
  status: 'pending' | 'active' | 'saved' | 'skipped';
}

export interface ExtractedInvoice {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  paymentDueDate: string;
  paymentTerms: string;
  lineItems: LineItem[];
  subtotal: number;
  taxGst: number;
  totalAmount: number;
  confidences: Record<string, FieldConfidence>;
  isHandwritten?: boolean;
  isLowQualityScan?: boolean;
  notes?: string;
  manualNotes?: string;
}

export interface PurchaseOrder {
  poNumber: string;
  poDate: string;
  supplierName: string;
  itemDescription: string;
  qtyOrdered: number;
  unitPrice: number;
  totalAmount: number;
  expectedDelivery: string;
}

export interface GoodsReceivedNote {
  grnNumber: string;
  grnDate: string;
  poNumber: string;
  supplierName: string;
  itemDescription: string;
  qtyOrdered: number;
  qtyReceived: number;
  condition: string;
  receivedBy: string;
}

export interface InvoiceLogEntry {
  invoiceNumber: string;
  invoiceDate: string;
  supplierName: string;
  poNumber: string;
  lineItemsSummary: string;
  subtotal: number;
  gst: number;
  totalAmount: number;
  paymentDueDate: string;
  matchStatus: 'Fully Matched' | 'Partial Match — Review Needed' | 'No Match — Manual Check Required' | 'Duplicate — Confirmed Saved' | string;
  reviewedBy?: string;
  reviewTimestamp?: string;
  manualNotes?: string;
  flags?: string[];
  savedAt?: string;
  documentUrl?: string;
  documentType?: 'image' | 'pdf';
  fileName?: string;
  isHandwritten?: boolean;
}

export interface MatchCheckResult {
  matchStatus: 'Fully Matched' | 'Partial Match — Review Needed' | 'No Match — Manual Check Required' | 'Duplicate — Confirmed Saved' | string;
  flags: string[];
  poFound: boolean;
  matchingPO?: PurchaseOrder;
  grnFound: boolean;
  matchingGRN?: GoodsReceivedNote;
  isDuplicate: boolean;
  duplicateDetails?: string;
  priceTolerancePercent: number;
  fieldMismatches: {
    supplierMismatch?: boolean;
    quantityMismatch?: boolean;
    priceMismatch?: boolean;
    grnConditionIssue?: boolean;
    grnQuantityShortage?: boolean;
  };
}
