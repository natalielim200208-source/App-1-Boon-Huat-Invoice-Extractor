import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { initAuthListener, logoutUser, getValidAccessToken, googleSignIn } from './lib/firebase';
import {
  findOrCreateBoonHuatSheet,
  fetchAllSheetData,
  appendInvoiceLogRow,
  clearInvoiceLogRows,
  DATABASE_SHEET_NAME,
  TARGET_SPREADSHEET_ID,
} from './lib/googleSheets';
import {
  ExtractedInvoice,
  PurchaseOrder,
  GoodsReceivedNote,
  InvoiceLogEntry,
  QueueInvoiceItem,
} from './types';
import { INITIAL_POS, INITIAL_GRNS, INITIAL_INVOICE_LOG } from './data/seedSheetData';
import { runInvoiceMatchChecks } from './lib/matchingEngine';

import { Header } from './components/Header';
import { SheetConnectorModal } from './components/SheetConnectorModal';
import { InvoiceUploader } from './components/InvoiceUploader';
import { ExtractionReviewTable } from './components/ExtractionReviewTable';
import { MatchVerificationCard } from './components/MatchVerificationCard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { InvoiceLogTable } from './components/InvoiceLogTable';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { OriginalDocumentViewer } from './components/OriginalDocumentViewer';
import { InvoiceQueueBar } from './components/InvoiceQueueBar';

import {
  Sparkles,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('bh_google_access_token')
  );
  const [sheetId, setSheetId] = useState<string | null>(
    localStorage.getItem('bh_google_sheet_id') || TARGET_SPREADSHEET_ID
  );
  const [isSheetConnectorOpen, setIsSheetConnectorOpen] = useState(false);
  const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Database Tab States
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [grns, setGrns] = useState<GoodsReceivedNote[]>(INITIAL_GRNS);
  const [invoiceLog, setInvoiceLog] = useState<InvoiceLogEntry[]>(INITIAL_INVOICE_LOG);

  // Active Invoice Extraction State & Sequential Queue State
  const [invoiceQueue, setInvoiceQueue] = useState<QueueInvoiceItem[]>([]);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);

  const [activeInvoice, setActiveInvoice] = useState<ExtractedInvoice | null>(null);
  const [activeDocumentUrl, setActiveDocumentUrl] = useState<string | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<'image' | 'pdf'>('image');
  const [activeDocumentFileName, setActiveDocumentFileName] = useState<string>('');

  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [isPreparingSave, setIsPreparingSave] = useState(false);
  const [saveDuplicateEntry, setSaveDuplicateEntry] = useState<InvoiceLogEntry | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [sheetLoadingError, setSheetLoadingError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      async (currentUser, token) => {
        setUser(currentUser);
        setIsDemoMode(false);
        const activeToken = token || (await getValidAccessToken());
        if (activeToken) {
          setAccessToken(activeToken);
          localStorage.setItem('bh_google_access_token', activeToken);
        }

        const savedSheetId = localStorage.getItem('bh_google_sheet_id') || TARGET_SPREADSHEET_ID;
        setSheetId(savedSheetId);
        
        if (activeToken) {
          await refreshSheetData(activeToken, savedSheetId);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setSheetId(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const autoConnectSheet = async (token: string) => {
    try {
      setSheetLoadingError(null);
      const id = await findOrCreateBoonHuatSheet(token);
      setSheetId(id);
      localStorage.setItem('bh_google_sheet_id', id);
      await refreshSheetData(token, id);
    } catch (err: any) {
      console.error('Auto connect sheet failed:', err);
      setSheetLoadingError('Could not sync with Google Sheets. Falling back to local state.');
    }
  };

  const refreshSheetData = async (token = accessToken, id = sheetId) => {
    let activeToken = token || (await getValidAccessToken());
    const activeSheetId = id || TARGET_SPREADSHEET_ID;
    if (!activeToken || !activeSheetId) {
      return { pos, grns, invoiceLogEntries: invoiceLog };
    }
    
    setIsSyncingSheet(true);
    try {
      const data = await fetchAllSheetData(activeToken, activeSheetId);
      setPos(data.pos.length > 0 ? data.pos : INITIAL_POS);
      setGrns(data.grns.length > 0 ? data.grns : INITIAL_GRNS);
      setInvoiceLog(data.invoiceLogEntries || []);
      return data;
    } catch (err: any) {
      console.warn('Failed to load sheet data:', err?.message || err);
      // If 401 or 403 or token error, clear stale token from localStorage
      if (
        err.message?.includes('401') ||
        err.message?.includes('403') ||
        err.message?.includes('UNAUTHENTICATED') ||
        err.message?.includes('Unauthorized') ||
        err.message?.includes('invalid_grant')
      ) {
        console.log('[Sheet Refresh] Token expired or invalid, clearing stale session token...');
        localStorage.removeItem('bh_google_access_token');
        setAccessToken(null);
      }
      return { pos, grns, invoiceLogEntries: invoiceLog };
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleSheetConnected = async (spreadsheetId: string, token?: string, authenticatedUser?: User) => {
    setSheetId(spreadsheetId);
    setIsDemoMode(false);
    localStorage.setItem('bh_google_sheet_id', spreadsheetId);

    const activeToken = token || accessToken || (await getValidAccessToken());
    if (activeToken) {
      setAccessToken(activeToken);
      localStorage.setItem('bh_google_access_token', activeToken);
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
    } else if (user) {
      setUser(user);
    }

    if (activeToken) {
      await refreshSheetData(activeToken, spreadsheetId);
    }
  };

  const handleClearInvoiceLog = () => {
    setInvoiceLog([]);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setAccessToken(null);
    setSheetId(null);
    setIsDemoMode(true);
  };

  const handleQueueCreated = (items: QueueInvoiceItem[]) => {
    setInvoiceQueue(items);
    setActiveQueueIndex(0);
    if (items.length > 0) {
      setActiveInvoice(items[0].extractedInvoice);
      setActiveDocumentUrl(items[0].fileDataUrl);
      setActiveDocumentType(items[0].fileType);
      setActiveDocumentFileName(items[0].fileName);
    }
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  };

  const handleSelectQueueIndex = (index: number) => {
    if (index >= 0 && index < invoiceQueue.length) {
      setActiveQueueIndex(index);
      const item = invoiceQueue[index];
      setActiveInvoice(item.extractedInvoice);
      setActiveDocumentUrl(item.fileDataUrl);
      setActiveDocumentType(item.fileType);
      setActiveDocumentFileName(item.fileName);
      setSaveSuccessMessage(null);
      setSaveErrorMessage(null);
    }
  };

  const handleResetQueue = () => {
    setInvoiceQueue([]);
    setActiveQueueIndex(0);
    setActiveInvoice(null);
    setActiveDocumentUrl(null);
    setActiveDocumentFileName('');
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  };

  // Run Real-Time 3-Way Match Verification Engine
  const matchResult = useMemo(() => {
    if (!activeInvoice) {
      return {
        matchStatus: 'No Match — Manual Check Required' as const,
        flags: ['No invoice active.'],
        poFound: false,
        grnFound: false,
        isDuplicate: false,
        fieldMismatches: {},
      };
    }
    return runInvoiceMatchChecks(activeInvoice, pos, grns, invoiceLog);
  }, [activeInvoice, pos, grns, invoiceLog]);

  // Prepare Invoice Log Entry Payload
  const preparedLogEntry = useMemo<InvoiceLogEntry | null>(() => {
    if (!activeInvoice) return null;

    const lineSummary = activeInvoice.lineItems
      .map((item) => `${item.description} (x${item.quantity})`)
      .join(', ');

    const reviewer = user?.displayName || user?.email || 'Natalie Lim (Madam Lim)';
    const nowTimestamp = new Date().toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });

    // Ensure manualNotes / reason column is never empty or "None" for non-perfect matches
    const userNotes = (activeInvoice.manualNotes || '').trim();
    let computedNotes = userNotes;

    if (!computedNotes || computedNotes.toLowerCase() === 'none') {
      if (matchResult.matchStatus !== 'Fully Matched') {
        const relevantFlags = (matchResult.flags || []).filter(
          (f) => !f.includes('within the acceptable') && !f.includes('all 3-way checks passed')
        );
        if (relevantFlags.length > 0) {
          computedNotes = relevantFlags.join(' | ');
        } else {
          computedNotes = matchResult.matchStatus;
        }
      } else {
        computedNotes = 'Verified & Approved';
      }
    }

    return {
      invoiceNumber: activeInvoice.invoiceNumber || 'UNSPECIFIED',
      invoiceDate: activeInvoice.invoiceDate || new Date().toISOString().split('T')[0],
      supplierName: activeInvoice.supplierName || 'UNSPECIFIED',
      poNumber: activeInvoice.poNumber || '',
      lineItemsSummary: lineSummary || 'No line items listed',
      subtotal: activeInvoice.subtotal,
      gst: activeInvoice.taxGst,
      totalAmount: activeInvoice.totalAmount,
      paymentDueDate: activeInvoice.paymentDueDate || activeInvoice.paymentTerms || 'Net 30',
      matchStatus: matchResult.matchStatus,
      reviewedBy: reviewer,
      reviewTimestamp: nowTimestamp,
      manualNotes: computedNotes,
      flags: matchResult.flags,
      savedAt: new Date().toISOString(),
      documentUrl: activeDocumentUrl || undefined,
      documentType: activeDocumentType,
      fileName: activeDocumentFileName,
      isHandwritten: activeInvoice.isHandwritten,
    };
  }, [activeInvoice, matchResult, activeDocumentUrl, activeDocumentType, activeDocumentFileName, user]);

  // Triggered when user clicks "Review & Save to Google Sheet"
  const handleInitiateSave = async () => {
    if (!activeInvoice) return;
    setIsPreparingSave(true);
    setSaveErrorMessage(null);

    let latestLog: InvoiceLogEntry[] = invoiceLog;

    // Fresh live read of Google Sheet before running duplicate check
    if (sheetId && !isDemoMode) {
      try {
        const freshData = await refreshSheetData();
        if (freshData?.invoiceLogEntries?.length) {
          latestLog = freshData.invoiceLogEntries;
        }
      } catch (e) {
        console.warn('Fresh sheet data refresh before save failed, using current log state:', e);
      }
    }

    // Required duplicate check (Invoice Number + Supplier Name against existing rows in Invoice Log)
    const cleanInvNo = (activeInvoice.invoiceNumber || '').trim().toUpperCase();
    const cleanSupplier = (activeInvoice.supplierName || '').trim().toLowerCase();

    const existingDuplicate = latestLog.find(
      (entry) =>
        entry.invoiceNumber.trim().toUpperCase() === cleanInvNo &&
        entry.supplierName.trim().toLowerCase() === cleanSupplier
    );

    setSaveDuplicateEntry(existingDuplicate || null);
    setIsConfirmationOpen(true);
    setIsPreparingSave(false);
  };

  const handleSaveConfirmed = async (isDuplicateOverride = false) => {
    if (!preparedLogEntry) return;

    setIsSavingRecord(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    // If saved anyway after duplicate confirmation, mark Match Status as "Duplicate — Confirmed Saved"
    const duplicateNote = 'Duplicate Invoice — Confirmed Saved after explicit user override ($3,400 overpayment protection check).';
    const entryToSave: InvoiceLogEntry = {
      ...preparedLogEntry,
      matchStatus: isDuplicateOverride
        ? 'Duplicate — Confirmed Saved'
        : preparedLogEntry.matchStatus,
      flags: isDuplicateOverride
        ? [
            ...(preparedLogEntry.flags || []),
            duplicateNote,
          ]
        : preparedLogEntry.flags,
      manualNotes: isDuplicateOverride
        ? (preparedLogEntry.manualNotes ? `${preparedLogEntry.manualNotes} | ${duplicateNote}` : duplicateNote)
        : preparedLogEntry.manualNotes,
    };

    try {
      let activeToken = accessToken || (await getValidAccessToken());
      const activeSheetId = sheetId || localStorage.getItem('bh_google_sheet_id') || TARGET_SPREADSHEET_ID;

      console.log('[Write to Sheet] Initiating append...', {
        hasSheetId: !!activeSheetId,
        hasToken: !!activeToken,
        isDemoMode,
        sheetId: activeSheetId,
        entryToSave,
      });

      if (activeSheetId && activeToken && !isDemoMode) {
        // Live Google Sheets API Write
        try {
          const writeResult = await appendInvoiceLogRow(activeToken, activeSheetId, entryToSave);
          await refreshSheetData(activeToken, activeSheetId);
          setSaveSuccessMessage(
            isDuplicateOverride
              ? `⚠️ Duplicate Saved & Flagged: Invoice ${entryToSave.invoiceNumber} logged to 'Invoice Log' tab with status 'Duplicate — Confirmed Saved'.`
              : `✅ Confirmed write to Google Sheet! Invoice ${entryToSave.invoiceNumber} logged to 'Invoice Log' tab (Range: ${writeResult.updatedRange || 'Invoice Log'}).`
          );
        } catch (writeErr: any) {
          // If token expired (401), auto-refresh and retry ONCE
          if (
            writeErr.message?.includes('401') ||
            writeErr.message?.includes('UNAUTHENTICATED') ||
            writeErr.message?.includes('Unauthorized') ||
            writeErr.message?.includes('INVALID_KEY')
          ) {
            console.log('[Write to Sheet] Token expired (401). Refreshing token and retrying...');
            const fresh = await googleSignIn();
            if (fresh?.accessToken) {
              setAccessToken(fresh.accessToken);
              const retryResult = await appendInvoiceLogRow(fresh.accessToken, activeSheetId, entryToSave);
              await refreshSheetData(fresh.accessToken, activeSheetId);
              setSaveSuccessMessage(
                isDuplicateOverride
                  ? `⚠️ Duplicate Saved & Flagged: Invoice ${entryToSave.invoiceNumber} logged to 'Invoice Log' tab with status 'Duplicate — Confirmed Saved'.`
                  : `✅ Confirmed write to Google Sheet! Invoice ${entryToSave.invoiceNumber} logged to 'Invoice Log' tab (Range: ${retryResult.updatedRange || 'Invoice Log'}).`
              );
            } else {
              throw writeErr;
            }
          } else {
            throw writeErr;
          }
        }
      } else {
        // Local Mode fallback
        setInvoiceLog((prev) => [entryToSave, ...prev]);
        
        const reason = isDemoMode
          ? 'App is currently in Local Demo Mode.'
          : !activeToken
          ? 'Google Account is not authenticated (OAuth access token missing).'
          : 'Google Sheet ID is not connected.';

        setSaveSuccessMessage(
          isDuplicateOverride
            ? `⚠️ Duplicate Saved & Flagged (Local Log): Invoice ${entryToSave.invoiceNumber} logged with status 'Duplicate — Confirmed Saved'.`
            : `✅ Invoice ${entryToSave.invoiceNumber} logged locally.`
        );

        if (!isDemoMode && (!activeToken || !activeSheetId)) {
          setSaveErrorMessage(
            `⚠️ Sheet Not Updated: Saved to local browser state only. Reason: ${reason} Please connect a live Google Sheet to write records.`
          );
        }
      }

      // Per-invoice sequential save: update status in queue & advance to next item
      if (invoiceQueue.length > 0) {
        const currentItemNum = activeQueueIndex + 1;
        const totalQueueCount = invoiceQueue.length;

        setInvoiceQueue((prev) => {
          const next = [...prev];
          if (next[activeQueueIndex]) {
            next[activeQueueIndex] = {
              ...next[activeQueueIndex],
              status: 'saved',
            };
          }
          return next;
        });

        let nextIndexToSelect = invoiceQueue.findIndex(
          (item, idx) => idx > activeQueueIndex && item.status !== 'saved'
        );
        if (nextIndexToSelect === -1) {
          nextIndexToSelect = invoiceQueue.findIndex(
            (item, idx) => idx !== activeQueueIndex && item.status !== 'saved'
          );
        }

        if (nextIndexToSelect !== -1) {
          const nextItem = invoiceQueue[nextIndexToSelect];
          setActiveQueueIndex(nextIndexToSelect);
          setActiveInvoice(nextItem.extractedInvoice);
          setActiveDocumentUrl(nextItem.fileDataUrl);
          setActiveDocumentType(nextItem.fileType);
          setActiveDocumentFileName(nextItem.fileName);

          setSaveSuccessMessage(
            isDuplicateOverride
              ? `⚠️ Saved & Flagged Duplicate (Invoice ${currentItemNum} of ${totalQueueCount}): '${entryToSave.invoiceNumber}'. Automatically advanced to Invoice ${nextIndexToSelect + 1} of ${totalQueueCount} for your review.`
              : `✅ Saved Invoice ${currentItemNum} of ${totalQueueCount} ('${entryToSave.invoiceNumber}') to Google Sheet! Automatically advanced to Invoice ${nextIndexToSelect + 1} of ${totalQueueCount} for your review.`
          );
        } else {
          setSaveSuccessMessage(
            isDuplicateOverride
              ? `⚠️ Final Invoice Saved & Flagged: Queue complete! All ${totalQueueCount} invoices have been reviewed and logged individually.`
              : `🎉 Queue Complete: All ${totalQueueCount} invoices were reviewed and saved individually to Google Sheet.`
          );
        }
      }

      setIsConfirmationOpen(false);
      setSaveDuplicateEntry(null);
    } catch (err: any) {
      console.error('Failed to save invoice record to Google Sheets:', err);
      const errMsg = err.message || 'Unknown error occurred while writing to Google Sheet.';
      setSaveErrorMessage(
        `Google Sheet Write Failed: ${errMsg}`
      );
    } finally {
      setIsSavingRecord(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        user={user}
        sheetId={sheetId}
        isSheetConnected={!!sheetId && !isDemoMode}
        onOpenSheetConnector={() => setIsSheetConnectorOpen(true)}
        onOpenDatabaseViewer={() => setIsDatabaseViewerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Responsible AI Assistant Guidelines Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Boon Huat Hardware Responsible AI Invoice Extraction Guidelines
              </p>
              <p className="mt-0.5 text-slate-600">
                • Accuracy prioritized over speed • Unreadable/low-confidence values flagged explicitly •
                Madam Lim must human-review & confirm every record before Google Sheet log finalization.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {sheetId && !isDemoMode ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Live Google Sheet Sync Active
              </span>
            ) : (
              <button
                onClick={() => setIsSheetConnectorOpen(true)}
                className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 text-[11px] font-bold uppercase tracking-wider transition"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Connect Live Google Sheet
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Upload Invoice */}
        <div className="w-full">
          <InvoiceUploader
            onQueueCreated={handleQueueCreated}
            isProcessing={isProcessingUpload}
            setIsProcessing={setIsProcessingUpload}
          />
        </div>

        {/* Section 1.5: Sequential Review Queue Progress Bar */}
        {invoiceQueue.length > 0 && (
          <InvoiceQueueBar
            queue={invoiceQueue}
            activeIndex={activeQueueIndex}
            onSelectIndex={handleSelectQueueIndex}
            onResetQueue={handleResetQueue}
          />
        )}

        {/* Empty State Banner when no invoice is active */}
        {!activeInvoice && !isProcessingUpload && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Ready for Invoice Processing</h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto">
              Upload a supplier invoice (PDF scan, JPG, or PNG image) using the box above. AI vision will extract key fields and run automatic 3-way matching against Boon Huat’s POs and GRNs.
            </p>
          </div>
        )}

        {/* Error Toast */}
        {saveErrorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start justify-between shadow-sm animate-in fade-in duration-200 space-x-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-800">Google Sheet Write Operation Failed</p>
                <p className="mt-1 font-mono text-xs text-red-700 break-all">{saveErrorMessage}</p>
                <div className="mt-2 flex items-center space-x-3">
                  <button
                    onClick={() => setIsSheetConnectorOpen(true)}
                    className="px-2.5 py-1 bg-red-600 text-white font-bold text-[11px] rounded hover:bg-red-700 transition uppercase tracking-wider"
                  >
                    Re-authenticate / Connect Sheet
                  </button>
                  <span className="text-[11px] text-red-600">
                    Check if user token has permissions to edit 'Invoice Log'
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSaveErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-xs font-bold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Toast */}
        {saveSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 2: Side-by-Side Visual Verification & Extraction Review */}
        {activeInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Original Invoice Document Viewer */}
              <div className="lg:col-span-5 h-full">
                <OriginalDocumentViewer
                  documentUrl={activeDocumentUrl}
                  documentType={activeDocumentType}
                  fileName={activeDocumentFileName}
                  confidences={activeInvoice.confidences}
                  isHandwritten={activeInvoice.isHandwritten}
                  isLowQualityScan={activeInvoice.isLowQualityScan}
                />
              </div>

              {/* Right Column: Extraction Review & Edit Table */}
              <div className="lg:col-span-7 h-full">
                <ExtractionReviewTable
                  invoice={activeInvoice}
                  onChange={(updated) => {
                    setActiveInvoice(updated);
                    if (invoiceQueue.length > 0 && activeQueueIndex >= 0 && activeQueueIndex < invoiceQueue.length) {
                      setInvoiceQueue((prev) => {
                        const next = [...prev];
                        next[activeQueueIndex] = {
                          ...next[activeQueueIndex],
                          extractedInvoice: updated,
                        };
                        return next;
                      });
                    }
                    setSaveSuccessMessage(null);
                  }}
                />
              </div>
            </div>

            <MatchVerificationCard
              matchResult={matchResult}
              manualNotes={activeInvoice.manualNotes || ''}
              onUpdateManualNotes={(notes) => {
                setActiveInvoice((prev) => (prev ? { ...prev, manualNotes: notes } : null));
                if (invoiceQueue.length > 0 && activeQueueIndex >= 0 && activeQueueIndex < invoiceQueue.length) {
                  setInvoiceQueue((prev) => {
                    const next = [...prev];
                    next[activeQueueIndex] = {
                      ...next[activeQueueIndex],
                      extractedInvoice: {
                        ...next[activeQueueIndex].extractedInvoice,
                        manualNotes: notes,
                      },
                    };
                    return next;
                  });
                }
              }}
              onFlagProcurement={(notes) => {
                setSaveSuccessMessage(
                  `Action noted: "${notes}". You can now proceed to review and save the record to the Invoice Log.`
                );
              }}
            />

            {/* Action Bar: Finalize and Write to Google Sheet (Sticky Bottom Action Bar) */}
            <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border-2 border-blue-600 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ring-1 ring-black/5">
              <div className="text-xs text-slate-700 font-medium">
                <span className="font-bold text-slate-900 uppercase tracking-wider block sm:inline mr-2">Status Ready:</span> Checked against POs &
                GRNs. Prepared row for tab <span className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Invoice Log</span>.
              </div>

              <button
                onClick={handleInitiateSave}
                disabled={isPreparingSave || isSavingRecord}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 shrink-0 border border-blue-700"
              >
                {isPreparingSave ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking Duplicate & Log Status...</span>
                  </>
                ) : (
                  <>
                    <span>Review & Save to Google Sheet</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Live Invoice Log Database View */}
        <InvoiceLogTable
          entries={invoiceLog}
          sheetId={sheetId}
          isGoogleSheetActive={!!sheetId && !isDemoMode}
          onClearInvoiceLog={handleClearInvoiceLog}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        Boon Huat Hardware & Supplies Pte Ltd • AI Invoice Processing Assistant • Internal Operating Tool
      </footer>

      {/* Modals */}
      <SheetConnectorModal
        isOpen={isSheetConnectorOpen}
        onClose={() => setIsSheetConnectorOpen(false)}
        user={user}
        sheetId={sheetId}
        onSheetConnected={handleSheetConnected}
        onUseLocalDemo={() => setIsDemoMode(true)}
        isDemoMode={isDemoMode}
      />

      <DatabaseViewerModal
        isOpen={isDatabaseViewerOpen}
        onClose={() => setIsDatabaseViewerOpen(false)}
        pos={pos}
        grns={grns}
        onRefresh={() => refreshSheetData()}
        isRefreshing={isSyncingSheet}
      />

      {preparedLogEntry && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => {
            setIsConfirmationOpen(false);
            setSaveDuplicateEntry(null);
          }}
          onConfirm={handleSaveConfirmed}
          entry={preparedLogEntry}
          isSaving={isSavingRecord}
          isGoogleSheetActive={!!sheetId && !isDemoMode}
          duplicateEntry={saveDuplicateEntry}
        />
      )}
    </div>
  );
}
