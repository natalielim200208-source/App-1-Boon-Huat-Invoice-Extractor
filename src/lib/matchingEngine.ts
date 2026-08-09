import {
  ExtractedInvoice,
  PurchaseOrder,
  GoodsReceivedNote,
  InvoiceLogEntry,
  MatchCheckResult,
} from '../types';

export function normalizePoNumber(str: string = ''): string {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ') // Strip zero-width & non-breaking spaces
    .trim()
    .toUpperCase()
    .replace(/^P\.?O\.?\s*[:#-]?\s*/i, 'PO-') // Normalize PO prefixes
    .replace(/\s+/g, '') // Remove internal whitespace
    .replace(/--+/g, '-'); // Normalize multiple hyphens
}

export function runInvoiceMatchChecks(
  invoice: ExtractedInvoice,
  allPOs: PurchaseOrder[],
  allGRNs: GoodsReceivedNote[],
  existingInvoiceLog: InvoiceLogEntry[]
): MatchCheckResult {
  const flags: string[] = [];
  const fieldMismatches = {
    supplierMismatch: false,
    quantityMismatch: false,
    priceMismatch: false,
    grnConditionIssue: false,
    grnQuantityShortage: false,
  };

  const cleanInvNo = (invoice.invoiceNumber || '').trim().toUpperCase();
  const cleanSupplier = (invoice.supplierName || '').trim().toLowerCase();
  const cleanPoNo = normalizePoNumber(invoice.poNumber || '');

  // 1. Duplicate Invoice Check
  const duplicateEntry = existingInvoiceLog.find(
    (entry) =>
      entry.invoiceNumber.trim().toUpperCase() === cleanInvNo &&
      entry.supplierName.trim().toLowerCase() === cleanSupplier
  );

  const isDuplicate = !!duplicateEntry;
  let duplicateDetails: string | undefined;

  if (isDuplicate) {
    duplicateDetails = `Invoice number ${invoice.invoiceNumber} from ${invoice.supplierName} already exists in Invoice Log (saved on ${duplicateEntry?.savedAt ? new Date(duplicateEntry.savedAt).toLocaleDateString() : 'earlier date'}). Proceeding risks duplicate payment.`;
    flags.push(`Duplicate Invoice Detected: ${duplicateDetails}`);
  }

  // 2. PO Lookup
  const matchingPO = allPOs.find(
    (po) => normalizePoNumber(po.poNumber) === cleanPoNo
  );
  const poFound = !!matchingPO;

  if (!poFound) {
    if (!cleanPoNo || cleanPoNo === 'PO-NOT-STATED' || cleanPoNo === 'NONE') {
      flags.push('No PO Number referenced on invoice — needs manual check.');
    } else {
      flags.push(`No matching PO found for '${invoice.poNumber}' — needs manual check.`);
    }
  } else {
    // Safeguard: Check Supplier Name match against PO
    const poSupplierClean = matchingPO.supplierName.trim().toLowerCase();
    if (cleanSupplier !== poSupplierClean && !cleanSupplier.includes(poSupplierClean) && !poSupplierClean.includes(cleanSupplier)) {
      fieldMismatches.supplierMismatch = true;
      flags.push(
        `⚠️ SUPPLIER MISMATCH WARNING: Invoice supplier ('${invoice.supplierName}') does not match PO '${matchingPO.poNumber}' supplier ('${matchingPO.supplierName}'). This indicates the PO reference on the invoice may be incorrect or misquoted. Manual verification is required.`
      );
    }

    // Compare total invoice quantity against PO Qty Ordered
    const totalInvoiceQty = invoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    if (totalInvoiceQty > 0 && matchingPO.qtyOrdered > 0 && totalInvoiceQty !== matchingPO.qtyOrdered) {
      fieldMismatches.quantityMismatch = true;
      flags.push(
        `Invoice total quantity (${totalInvoiceQty}) does not match PO quantity ordered (${matchingPO.qtyOrdered}) for '${matchingPO.itemDescription}'.`
      );
    }

    // Compare unit prices with defined tolerance threshold (5%)
    const priceTolerancePercent = 5.0; // 5% variance tolerance
    const firstLineItem = invoice.lineItems[0];
    const invPrice = Number(firstLineItem?.unitPrice) || 0;
    const poPrice = Number(matchingPO?.unitPrice) || 0;
    if (firstLineItem && invPrice > 0 && poPrice > 0) {
      const priceDiff = Math.abs(invPrice - poPrice);
      const varPercent = (priceDiff / poPrice) * 100;
      if (varPercent > priceTolerancePercent) {
        fieldMismatches.priceMismatch = true;
        flags.push(
          `Flagged as Partial Match because unit price variance (${varPercent.toFixed(1)}%) exceeds the ${priceTolerancePercent}% tolerance threshold (PO: $${poPrice.toFixed(2)}, Invoice: $${invPrice.toFixed(2)}).`
        );
      } else if (priceDiff > 0.001) {
        // Within tolerance threshold
        flags.push(
          `Unit price variance (${varPercent.toFixed(1)}%) is within the acceptable ${priceTolerancePercent}% tolerance threshold (PO: $${poPrice.toFixed(2)}, Invoice: $${invPrice.toFixed(2)}).`
        );
      }
    }
  }

  // 3. GRN Cross-Check
  const matchingGRN = poFound
    ? allGRNs.find(
        (grn) => normalizePoNumber(grn.poNumber) === cleanPoNo
      )
    : undefined;
  const grnFound = !!matchingGRN;

  if (poFound) {
    if (!grnFound) {
      flags.push(
        `No GRN found for PO '${invoice.poNumber}' — goods may not have been received yet. Do not approve for payment.`
      );
    } else {
      // Check Qty Received vs Qty Billed on Invoice
      const totalInvoiceQty = invoice.lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );

      if (matchingGRN.qtyReceived < matchingPO!.qtyOrdered) {
        fieldMismatches.grnQuantityShortage = true;
        flags.push(
          `GRN '${matchingGRN.grnNumber}' received quantity (${matchingGRN.qtyReceived}) is less than PO ordered quantity (${matchingPO!.qtyOrdered}). Partial delivery risk.`
        );
      }

      if (totalInvoiceQty > matchingGRN.qtyReceived) {
        fieldMismatches.grnQuantityShortage = true;
        flags.push(
          `Invoice quantity billed (${totalInvoiceQty}) exceeds GRN quantity received (${matchingGRN.qtyReceived}) for '${matchingGRN.itemDescription}'.`
        );
      }

      // Check Condition
      const condClean = (matchingGRN.condition || '').trim();
      const condLower = condClean.toLowerCase();

      // Field level verification safeguard: verify that displayed GRN values exist in the GRNs dataset
      if (matchingGRN.receivedBy) {
        const validReceivedByList = allGRNs.map((g) => g.receivedBy?.trim().toLowerCase()).filter(Boolean);
        if (!validReceivedByList.includes(matchingGRN.receivedBy.trim().toLowerCase())) {
          flags.push(
            `⚠️ GRN Field Verification Error: 'Received By' value ('${matchingGRN.receivedBy}') on GRN '${matchingGRN.grnNumber}' could not be verified against actual records in the GRNs sheet tab.`
          );
        }
      }

      // Condition check: "Good" or "Good Condition" (case-insensitive) proceeds as normal.
      // Anything other than "Good" (e.g. "Damaged (5 boxes)", "Partial Damage", "Rejected") triggers a review flag.
      const isGoodCondition =
        condLower === 'good' ||
        condLower === 'good condition' ||
        (condLower.startsWith('good') &&
          !condLower.includes('damage') &&
          !condLower.includes('reject') &&
          !condLower.includes('crushed') &&
          !condLower.includes('broken') &&
          !condLower.includes('defect') &&
          !condLower.includes('shortage') &&
          !condLower.includes('backorder') &&
          !condLower.includes('partial'));

      if (!isGoodCondition) {
        fieldMismatches.grnConditionIssue = true;
        let conditionDetail = condClean;
        const matchParen = condClean.match(/damaged\s*\(([^)]+)\)/i);
        if (matchParen && matchParen[1]) {
          conditionDetail = matchParen[1].trim();
        }
        flags.push(
          `GRN indicates damaged goods (${conditionDetail}) — do not approve full payment until resolved with supplier.`
        );
      }
    }
  }

  // Determine Overall Match Status
  const hasReviewNeeded =
    isDuplicate ||
    fieldMismatches.supplierMismatch ||
    fieldMismatches.quantityMismatch ||
    fieldMismatches.priceMismatch ||
    fieldMismatches.grnConditionIssue ||
    fieldMismatches.grnQuantityShortage;

  let matchStatus: MatchCheckResult['matchStatus'] = 'Fully Matched';

  if (!poFound || !grnFound) {
    matchStatus = 'No Match — Manual Check Required';
  } else if (hasReviewNeeded) {
    matchStatus = 'Partial Match — Review Needed';
  } else {
    matchStatus = 'Fully Matched';
  }

  return {
    matchStatus,
    flags,
    poFound,
    matchingPO,
    grnFound,
    matchingGRN,
    isDuplicate,
    duplicateDetails,
    priceTolerancePercent: 5.0,
    fieldMismatches,
  };
}
