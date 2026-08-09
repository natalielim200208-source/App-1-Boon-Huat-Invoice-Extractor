import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn } from '../lib/firebase';
import { findOrCreateBoonHuatSheet, DATABASE_SHEET_NAME, TARGET_SPREADSHEET_ID } from '../lib/googleSheets';
import { FileSpreadsheet, Sparkles, AlertCircle, Loader2, X, Link, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SheetConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  sheetId: string | null;
  onSheetConnected: (spreadsheetId: string, accessToken?: string, user?: User) => void;
  onUseLocalDemo: () => void;
  isDemoMode: boolean;
}

export const SheetConnectorModal: React.FC<SheetConnectorModalProps> = ({
  isOpen,
  onClose,
  user,
  sheetId,
  onSheetConnected,
  onUseLocalDemo,
  isDemoMode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSheetId, setCustomSheetId] = useState('');

  if (!isOpen) return null;

  const currentActiveSheetId = sheetId || TARGET_SPREADSHEET_ID;

  const handleSignInAndConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[OAuth Sign-in] Initiating Google Sign-In popup...');
      const authResult = await googleSignIn();
      if (!authResult?.accessToken) {
        throw new Error('Google Sign-in failed or OAuth access token was not returned.');
      }

      console.log('[OAuth Sign-in] Success! Received OAuth access token.', {
        userEmail: authResult.user.email,
        tokenPrefix: `${authResult.accessToken.substring(0, 10)}...`,
      });

      // Connect to target sheet
      const id = await findOrCreateBoonHuatSheet(authResult.accessToken, currentActiveSheetId);
      
      console.log('[Sheet Connected Successfully!]', { spreadsheetId: id, userEmail: authResult.user.email });
      onSheetConnected(id, authResult.accessToken, authResult.user);
      onClose();
    } catch (err: any) {
      console.error('[Sheet Connection Error Details]', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        fullErrorObject: err,
      });

      const detailedMsg = err.message || 'Failed to connect to Google Sheets.';
      setError(detailedMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;

    // Extract sheet ID if full URL pasted
    let cleanedId = customSheetId.trim();
    const match = cleanedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanedId = match[1];
    }

    onSheetConnected(cleanedId);
    onClose();
  };

  const handleResetToDefault = () => {
    onSheetConnected(TARGET_SPREADSHEET_ID);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Google Sheet Connection Settings</h3>
            <p className="text-xs text-slate-400">
              Target Sheet: <span className="font-mono text-amber-300 font-bold">{DATABASE_SHEET_NAME}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Connection Issue</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Active Target Info */}
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-400">Target Spreadsheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${currentActiveSheetId}`}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline font-mono truncate max-w-[200px]"
                title={currentActiveSheetId}
              >
                {currentActiveSheetId}
              </a>
            </div>
            {currentActiveSheetId === TARGET_SPREADSHEET_ID && (
              <p className="text-[11px] text-emerald-400 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                Using hardcoded target sheet: 1z5n_2EHMDTwH6mie96lx7ZvcyoVz0aXY
              </p>
            )}
          </div>

          {/* Main Option: Sign in with Google & Sync */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center">
                  <Sparkles className="w-4 h-4 text-amber-400 mr-1.5" />
                  Sign in & Authenticate Google Sheets
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Connects your Google Account with full read/write permission to write extracted invoices directly to:
                </p>
                <ul className="text-[11px] text-slate-400 mt-1.5 space-y-0.5 list-disc list-inside font-mono">
                  <li><span className="text-slate-200">Invoice Log</span> tab</li>
                  <li><span className="text-slate-200">Purchase Orders (POs)</span> tab</li>
                  <li><span className="text-slate-200">Goods Received Notes (GRNs)</span> tab</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleSignInAndConnect}
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-900 font-medium rounded-xl border border-slate-300 shadow-sm flex items-center justify-center space-x-3 transition disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  <span>Authenticating Google account...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{user ? 'Re-Authenticate & Grant Scope' : 'Sign in with Google Account'}</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: Change / Paste existing Sheet ID */}
          <form onSubmit={handleManualSheetSubmit} className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium text-slate-300">
                Change Target Google Sheet Link / ID:
              </label>
              {currentActiveSheetId !== TARGET_SPREADSHEET_ID && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-amber-400 hover:underline font-medium"
                >
                  Reset to Default Sheet
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Paste Google Sheet URL or ID..."
                  value={customSheetId}
                  onChange={(e) => setCustomSheetId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition shrink-0"
              >
                Update Sheet ID
              </button>
            </div>
          </form>

          {/* Option 3: Local Demo Mode */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Want to test without signing in?</span>
            <button
              onClick={() => {
                onUseLocalDemo();
                onClose();
              }}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Use Local In-Memory Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
