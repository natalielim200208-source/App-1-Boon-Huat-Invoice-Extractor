import { InvoiceLogEntry, PurchaseOrder, GoodsReceivedNote } from '../types';
import { INITIAL_POS, INITIAL_GRNS, INITIAL_INVOICE_LOG } from '../data/seedSheetData';

export const DATABASE_SHEET_NAME = 'Boon_Huat Hardware_&_Supplies_Pte_Ltd_Database_AIS';
export const TARGET_SPREADSHEET_ID = '11K8b6GxByrSCnJLt_EAMTRnv7z7ZkOxI5V1TMNzojfU';

export const INVOICE_LOG_COLUMNS = [
  'Invoice Number',
  'Invoice Date',
  'Supplier Name',
  'PO Number',
  'Item Description',
  'Subtotal ($)',
  'GST ($)',
  'Total Amount ($)',
  'Payment Due Date',
  'Initial Check Status',
  'Invoice Extraction Reviewed By',
  'Invoice Extraction Review Timestamp',
  'Invoice Extraction Notes',
];

export const PO_COLUMNS = [
  'PO Number',
  'PO Date',
  'Supplier Name',
  'Item Description',
  'Qty Ordered',
  'Unit Price ($)',
  'Total Amount ($)',
  'Expected Delivery',
];

export const GRN_COLUMNS = [
  'GRN Number',
  'GRN Date',
  'PO Number',
  'Supplier Name',
  'Item Description',
  'Qty Ordered',
  'Qty Received',
  'Condition',
  'Received By',
];

// 1. Connect directly to the target Boon Huat Hardware database Google Sheet
export async function findOrCreateBoonHuatSheet(accessToken: string, overrideSpreadsheetId?: string): Promise<string> {
  const targetId = overrideSpreadsheetId || localStorage.getItem('bh_google_sheet_id') || TARGET_SPREADSHEET_ID;
  console.log('[Google Sheets API] Connecting directly to target spreadsheet ID:', targetId);

  // Attempt to check tabs if token is provided
  if (accessToken) {
    try {
      await ensureSheetTabsAndSeed(accessToken, targetId);
    } catch (err) {
      console.warn('[Google Sheets API] Sheet tab verification warning:', err);
    }
  }

  return targetId;
}

// 2. Populate Header rows and Seed POs & GRNs
async function initializeSheetData(accessToken: string, spreadsheetId: string) {
  // Batch update header rows and initial seeds
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const poSeedRows = INITIAL_POS.map((po) => [
    po.poNumber,
    po.poDate,
    po.supplierName,
    po.itemDescription,
    po.qtyOrdered,
    po.unitPrice,
    po.totalAmount,
    po.expectedDelivery,
  ]);

  const grnSeedRows = INITIAL_GRNS.map((grn) => [
    grn.grnNumber,
    grn.grnDate,
    grn.poNumber,
    grn.supplierName,
    grn.itemDescription,
    grn.qtyOrdered,
    grn.qtyReceived,
    grn.condition,
    grn.receivedBy,
  ]);

  const invoiceSeedRows = INITIAL_INVOICE_LOG.map((inv) => [
    inv.invoiceNumber,
    inv.invoiceDate,
    inv.supplierName,
    inv.poNumber,
    inv.lineItemsSummary,
    inv.subtotal,
    inv.gst,
    inv.totalAmount,
    inv.paymentDueDate,
    inv.matchStatus,
  ]);

  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Invoice Log'!A1:J1",
        values: [INVOICE_LOG_COLUMNS],
      },
      {
        range: `'Invoice Log'!A2:J${invoiceSeedRows.length + 1}`,
        values: invoiceSeedRows,
      },
      {
        range: "'Purchase Orders (POs)'!A1:H1",
        values: [PO_COLUMNS],
      },
      {
        range: `'Purchase Orders (POs)'!A2:H${poSeedRows.length + 1}`,
        values: poSeedRows,
      },
      {
        range: "'Goods Received Notes (GRNs)'!A1:I1",
        values: [GRN_COLUMNS],
      },
      {
        range: `'Goods Received Notes (GRNs)'!A2:I${grnSeedRows.length + 1}`,
        values: grnSeedRows,
      },
    ],
  };

  await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Ensure sheet tabs exist if created manually or through existing sheet
export async function ensureSheetTabsAndSeed(accessToken: string, spreadsheetId: string) {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return;

  const data = await res.json();
  const existingTitles = (data.sheets || []).map((s: any) => s.properties?.title);

  const requests: any[] = [];

  // If Sheet1 exists, rename it to "Invoice Log" if Invoice Log is missing
  if (!existingTitles.includes('Invoice Log') && existingTitles.includes('Sheet1')) {
    // rename Sheet1
    const sheet1Obj = data.sheets.find((s: any) => s.properties?.title === 'Sheet1');
    if (sheet1Obj) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: sheet1Obj.properties.sheetId, title: 'Invoice Log' },
          fields: 'title',
        },
      });
    }
  } else if (!existingTitles.includes('Invoice Log')) {
    requests.push({ addSheet: { properties: { title: 'Invoice Log' } } });
  }

  if (!existingTitles.includes('Purchase Orders (POs)')) {
    requests.push({ addSheet: { properties: { title: 'Purchase Orders (POs)' } } });
  }

  if (!existingTitles.includes('Goods Received Notes (GRNs)')) {
    requests.push({ addSheet: { properties: { title: 'Goods Received Notes (GRNs)' } } });
  }

  if (requests.length > 0) {
    const batchReqUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await fetch(batchReqUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    // Check if PO tab has headers
    await initializeSheetData(accessToken, spreadsheetId);
  }

  // Ensure Invoice Log tab has the header row at row 1
  await ensureInvoiceLogHeader(accessToken, spreadsheetId);
}

// Ensure the header row exists on Invoice Log tab, and shift existing data down if row 1 is data
export async function ensureInvoiceLogHeader(accessToken: string, spreadsheetId: string): Promise<void> {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A1:M500`;
  try {
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn('[ensureInvoiceLogHeader] Unable to fetch Invoice Log range:', res.statusText);
      return;
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];

    if (rows.length === 0) {
      console.log('[ensureInvoiceLogHeader] Invoice Log tab is empty. Writing header row to A1:M1...');
      await writeHeaderRow(accessToken, spreadsheetId);
      return;
    }

    const firstCell = (rows[0][0] || '').toString().trim();
    if (firstCell.toLowerCase() === 'invoice number') {
      console.log('[ensureInvoiceLogHeader] Header row already present in row 1.');
      return;
    }

    console.log(`[ensureInvoiceLogHeader] Row 1 contains data ("${firstCell}") without header. Inserting header and shifting data down.`);
    const updatedRows = [INVOICE_LOG_COLUMNS, ...rows];
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A1:M${updatedRows.length}?valueInputOption=USER_ENTERED`;

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: updatedRows }),
    });

    if (updateRes.ok) {
      console.log('[ensureInvoiceLogHeader] Successfully inserted header row and shifted existing data down.');
    } else {
      console.error('[ensureInvoiceLogHeader] Failed to insert header row:', updateRes.statusText);
    }
  } catch (err) {
    console.warn('[ensureInvoiceLogHeader] Error ensuring header:', err);
  }
}

async function writeHeaderRow(accessToken: string, spreadsheetId: string) {
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A1:M1?valueInputOption=USER_ENTERED`;
  await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [INVOICE_LOG_COLUMNS] }),
  });
}

export interface InvoiceLogColumnIndices {
  invoiceNumber: number;
  invoiceDate: number;
  supplierName: number;
  poNumber: number;
  lineItemsSummary: number;
  subtotal: number;
  gst: number;
  totalAmount: number;
  paymentDueDate: number;
  matchStatus: number;
  reviewedBy: number;
  reviewTimestamp: number;
  manualNotes: number;
}

export function parseInvoiceLogHeaderIndices(headerRow: any[]): InvoiceLogColumnIndices {
  const headers = (headerRow || []).map((h) => (h || '').toString().trim().toLowerCase());

  const findIdx = (predicate: (h: string) => boolean, defaultIdx: number) => {
    const idx = headers.findIndex(predicate);
    return idx !== -1 ? idx : defaultIdx;
  };

  const invoiceNumber = findIdx((h) => h.includes('invoice number') || h.includes('inv no') || h === 'invoice #', 0);
  const invoiceDate = findIdx((h) => h.includes('invoice date') || h.includes('inv date'), 1);
  const supplierName = findIdx((h) => h.includes('supplier name') || h.includes('supplier'), 2);
  const poNumber = findIdx((h) => h.includes('po number') || h.includes('po ref') || h.includes('po #'), 3);
  const lineItemsSummary = findIdx(
    (h) => h.includes('item description') || h.includes('line items') || h.includes('items summary'),
    4
  );
  const subtotal = findIdx((h) => h.includes('subtotal'), 5);
  const gst = findIdx((h) => h.includes('gst') || h.includes('tax'), 6);
  const totalAmount = findIdx((h) => h.includes('total amount') || h.includes('total ($)') || h === 'total', 7);
  const paymentDueDate = findIdx((h) => h.includes('payment due') || h.includes('due date'), 8);

  // CRITICAL: Initial Check Status MUST NOT match Final Check Status!
  const matchStatus = findIdx(
    (h) =>
      !h.includes('final') &&
      (h.includes('initial check status') ||
        h.includes('initial match status') ||
        h.includes('initial check') ||
        h.includes('match status')),
    9
  );

  // CRITICAL: Invoice Extraction Reviewed By MUST NOT match Final Reviewed By!
  const reviewedBy = findIdx(
    (h) =>
      !h.includes('final') &&
      (h.includes('invoice extraction reviewed by') ||
        h.includes('extraction reviewed by') ||
        h.includes('reviewed by')),
    10
  );

  // CRITICAL: Invoice Extraction Review Timestamp MUST NOT match Final Review Timestamp!
  const reviewTimestamp = findIdx(
    (h) =>
      !h.includes('final') &&
      (h.includes('invoice extraction review timestamp') ||
        h.includes('extraction review timestamp') ||
        h.includes('review timestamp') ||
        h.includes('timestamp')),
    11
  );

  // CRITICAL: Invoice Extraction Notes MUST NOT match Final Audit Notes!
  const manualNotes = findIdx(
    (h) =>
      !h.includes('final') &&
      !h.includes('audit') &&
      (h.includes('invoice extraction notes') ||
        h.includes('extraction notes') ||
        h.includes('manual check notes') ||
        h.includes('manual notes') ||
        h.includes('notes')),
    12
  );

  return {
    invoiceNumber,
    invoiceDate,
    supplierName,
    poNumber,
    lineItemsSummary,
    subtotal,
    gst,
    totalAmount,
    paymentDueDate,
    matchStatus,
    reviewedBy,
    reviewTimestamp,
    manualNotes,
  };
}

// 3. Read data from all 3 tabs
export async function fetchAllSheetData(accessToken: string, spreadsheetId: string) {
  const ranges = [
    "'Invoice Log'!A1:Z500",
    "'Purchase Orders (POs)'!A1:H500",
    "'Goods Received Notes (GRNs)'!A1:I500",
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join('&')}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    let errDetail = '';
    try {
      const errJson = await res.json();
      errDetail = errJson?.error?.message || '';
    } catch (_) {}
    throw new Error(`Failed to fetch sheet data (HTTP ${res.status}${res.statusText ? ' ' + res.statusText : ''}): ${errDetail || 'Unauthorized or sheet unavailable'}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  const invLogRows = valueRanges[0]?.values || [];
  const poRows = valueRanges[1]?.values || [];
  const grnRows = valueRanges[2]?.values || [];

  const headerRow = invLogRows[0] || INVOICE_LOG_COLUMNS;
  const indices = parseInvoiceLogHeaderIndices(headerRow);

  // Parse Invoice Log (skip header)
  const invoiceLogEntries: InvoiceLogEntry[] = invLogRows.slice(1).map((row: any) => ({
    invoiceNumber: (row[indices.invoiceNumber] || '').toString().trim(),
    invoiceDate: (row[indices.invoiceDate] || '').toString().trim(),
    supplierName: (row[indices.supplierName] || '').toString().trim(),
    poNumber: (row[indices.poNumber] || '').toString().trim(),
    lineItemsSummary: (row[indices.lineItemsSummary] || '').toString().trim(),
    subtotal: Number(row[indices.subtotal]) || 0,
    gst: Number(row[indices.gst]) || 0,
    totalAmount: Number(row[indices.totalAmount]) || 0,
    paymentDueDate: (row[indices.paymentDueDate] || '').toString().trim(),
    matchStatus: (row[indices.matchStatus] as any) || 'No Match — Manual Check Required',
    reviewedBy: (row[indices.reviewedBy] || '').toString().trim(),
    reviewTimestamp: (row[indices.reviewTimestamp] || '').toString().trim(),
    manualNotes: (row[indices.manualNotes] || '').toString().trim(),
  }));

  // Parse POs (skip header)
  const pos: PurchaseOrder[] = poRows.slice(1).map((row: any) => ({
    poNumber: (row[0] || '').toString().trim(),
    poDate: (row[1] || '').toString().trim(),
    supplierName: (row[2] || '').toString().trim(),
    itemDescription: (row[3] || '').toString().trim(),
    qtyOrdered: Number(row[4]) || 0,
    unitPrice: Number(row[5]) || 0,
    totalAmount: Number(row[6]) || 0,
    expectedDelivery: (row[7] || '').toString().trim(),
  }));

  // Parse GRNs (skip header)
  const grns: GoodsReceivedNote[] = grnRows.slice(1).map((row: any) => ({
    grnNumber: (row[0] || '').toString().trim(),
    grnDate: (row[1] || '').toString().trim(),
    poNumber: (row[2] || '').toString().trim(),
    supplierName: (row[3] || '').toString().trim(),
    itemDescription: (row[4] || '').toString().trim(),
    qtyOrdered: Number(row[5]) || 0,
    qtyReceived: Number(row[6]) || 0,
    condition: (row[7] || 'Good').toString().trim(),
    receivedBy: (row[8] || '').toString().trim(),
  }));

  return {
    invoiceLogEntries,
    pos,
    grns,
  };
}

export interface GoogleSheetsAppendResult {
  success: boolean;
  spreadsheetId: string;
  range: string;
  updatedRange?: string;
  updatedRows?: number;
  updatedCells?: number;
  rawResponse: any;
}

// 4. Append or update row in Invoice Log tab (writes strictly to App 1 columns, never overwrites Final Check Status)
export async function appendInvoiceLogRow(
  accessToken: string,
  spreadsheetId: string,
  entry: InvoiceLogEntry
): Promise<GoogleSheetsAppendResult> {
  // Ensure header row exists before writing
  await ensureInvoiceLogHeader(accessToken, spreadsheetId);

  // Fetch current Invoice Log sheet data to inspect existing headers and rows
  const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A1:Z500`;
  const fetchRes = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let fetchedRows: any[][] = [];
  if (fetchRes.ok) {
    const json = await fetchRes.json();
    fetchedRows = json.values || [];
  }

  const headerRow = fetchedRows[0] || INVOICE_LOG_COLUMNS;
  const indices = parseInvoiceLogHeaderIndices(headerRow);

  const userNotes = (entry.manualNotes || '').trim();
  let finalNotes = userNotes;

  if (!finalNotes || finalNotes.toLowerCase() === 'none') {
    if (entry.matchStatus !== 'Fully Matched') {
      const relevantFlags = (entry.flags || []).filter(
        (f) => !f.includes('within the acceptable') && !f.includes('all 3-way checks passed')
      );
      if (relevantFlags.length > 0) {
        finalNotes = relevantFlags.join(' | ');
      } else {
        finalNotes = entry.matchStatus;
      }
    } else {
      finalNotes = 'Verified & Approved';
    }
  }

  // Check if this invoice number already exists in 'Invoice Log' tab
  const searchInvNum = (entry.invoiceNumber || '').trim().toLowerCase();
  let existingRowIdx = -1; // 0-indexed in fetchedRows array
  if (searchInvNum && fetchedRows.length > 1) {
    existingRowIdx = fetchedRows.findIndex(
      (r, idx) => idx > 0 && (r[indices.invoiceNumber] || '').toString().trim().toLowerCase() === searchInvNum
    );
  }

  if (existingRowIdx > 0) {
    // UPDATE EXISTING ROW (Targeted update on App 1 columns only; preserves Final Check Status & App 2 columns)
    const existingRow = fetchedRows[existingRowIdx] || [];
    const maxIndex = Math.max(existingRow.length, headerRow.length, ...Object.values(indices).map((n) => n + 1));
    const updatedRow = [...existingRow];
    while (updatedRow.length < maxIndex) {
      updatedRow.push('');
    }

    // Update ONLY App 1 designated columns
    updatedRow[indices.invoiceNumber] = entry.invoiceNumber;
    updatedRow[indices.invoiceDate] = entry.invoiceDate;
    updatedRow[indices.supplierName] = entry.supplierName;
    updatedRow[indices.poNumber] = entry.poNumber;
    updatedRow[indices.lineItemsSummary] = entry.lineItemsSummary;
    updatedRow[indices.subtotal] = entry.subtotal;
    updatedRow[indices.gst] = entry.gst;
    updatedRow[indices.totalAmount] = entry.totalAmount;
    updatedRow[indices.paymentDueDate] = entry.paymentDueDate;
    updatedRow[indices.matchStatus] = entry.matchStatus;
    updatedRow[indices.reviewedBy] = entry.reviewedBy || 'Natalie Lim (Madam Lim)';
    updatedRow[indices.reviewTimestamp] = entry.reviewTimestamp || new Date().toLocaleString();
    updatedRow[indices.manualNotes] = finalNotes;

    const sheetRowNumber = existingRowIdx + 1; // 1-based row in Google Sheets
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A${sheetRowNumber}:Z${sheetRowNumber}?valueInputOption=USER_ENTERED`;

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [updatedRow] }),
    });

    const rawText = await updateRes.text();
    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (e) {}

    if (!updateRes.ok) {
      const apiErrorMsg = parsedJson?.error?.message || rawText;
      throw new Error(`Google Sheets Update Row Failed (HTTP ${updateRes.status}): ${apiErrorMsg}`);
    }

    return {
      success: true,
      spreadsheetId,
      range: `'Invoice Log'!A${sheetRowNumber}:Z${sheetRowNumber}`,
      updatedRange: parsedJson?.updatedRange || `'Invoice Log'!A${sheetRowNumber}`,
      updatedRows: 1,
      updatedCells: updatedRow.length,
      rawResponse: parsedJson || rawText,
    };
  } else {
    // APPEND NEW ROW into App 1 designated columns
    const maxIndex = Math.max(headerRow.length, ...Object.values(indices).map((n) => n + 1));
    const newRow = new Array(maxIndex).fill('');

    newRow[indices.invoiceNumber] = entry.invoiceNumber;
    newRow[indices.invoiceDate] = entry.invoiceDate;
    newRow[indices.supplierName] = entry.supplierName;
    newRow[indices.poNumber] = entry.poNumber;
    newRow[indices.lineItemsSummary] = entry.lineItemsSummary;
    newRow[indices.subtotal] = entry.subtotal;
    newRow[indices.gst] = entry.gst;
    newRow[indices.totalAmount] = entry.totalAmount;
    newRow[indices.paymentDueDate] = entry.paymentDueDate;
    newRow[indices.matchStatus] = entry.matchStatus;
    newRow[indices.reviewedBy] = entry.reviewedBy || 'Natalie Lim (Madam Lim)';
    newRow[indices.reviewTimestamp] = entry.reviewTimestamp || new Date().toLocaleString();
    newRow[indices.manualNotes] = finalNotes;

    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Invoice%20Log'!A:Z:append?valueInputOption=USER_ENTERED`;
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [newRow] }),
    });

    const rawText = await appendRes.text();
    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (e) {}

    if (!appendRes.ok) {
      const apiErrorMsg = parsedJson?.error?.message || rawText;
      throw new Error(`Google Sheets Append Failed (HTTP ${appendRes.status}): ${apiErrorMsg}`);
    }

    return {
      success: true,
      spreadsheetId,
      range: "'Invoice Log'!A:Z",
      updatedRange: parsedJson?.updates?.updatedRange,
      updatedRows: parsedJson?.updates?.updatedRows || 1,
      updatedCells: parsedJson?.updates?.updatedCells,
      rawResponse: parsedJson || rawText,
    };
  }
}

// 5. Clear all data rows from Invoice Log tab while preserving header row
export async function clearInvoiceLogRows(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; clearedRange: string }> {
  const range = "'Invoice Log'!A2:Z1000";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:clear`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to clear Invoice Log (HTTP ${res.status}): ${errText}`);
  }

  // Ensure header row remains intact at A1:J1
  await ensureInvoiceLogHeader(accessToken, spreadsheetId);

  return {
    success: true,
    clearedRange: range,
  };
}
