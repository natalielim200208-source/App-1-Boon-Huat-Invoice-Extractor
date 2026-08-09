import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, LogOut, Database, Sparkles, ExternalLink } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  sheetId: string | null;
  isSheetConnected: boolean;
  onOpenSheetConnector: () => void;
  onOpenDatabaseViewer: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  sheetId,
  isSheetConnected,
  onOpenSheetConnector,
  onOpenDatabaseViewer,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Company Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl rounded shadow-sm shrink-0">
              BH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-white uppercase">
                  Boon Huat Hardware & Supplies
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5 font-medium">
                Invoice Verification & 3-Way Matching Terminal
              </p>
            </div>
          </div>

          {/* Action & Status Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Database Viewer Trigger */}
            <button
              onClick={onOpenDatabaseViewer}
              className="inline-flex items-center px-3.5 py-2 rounded text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="View loaded Purchase Orders & Goods Received Notes"
            >
              <Database className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              PO & GRN DATABASE
            </button>

            {/* Google Sheets Connection Badge */}
            {isSheetConnected && sheetId ? (
              <div className="flex items-center space-x-2 bg-emerald-950/90 border border-emerald-500/40 px-3 py-1.5 rounded text-xs font-bold text-emerald-300">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[180px]" title={`Target Sheet ID: ${sheetId}`}>
                  Boon_Huat...Database
                </span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition p-0.5"
                  title="Open live Google Sheet in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
                <button
                  onClick={onOpenSheetConnector}
                  className="ml-1 text-[10px] text-emerald-300 hover:text-white underline font-semibold transition px-1.5 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/30"
                  title="View or Change Connected Google Sheet ID"
                >
                  Change Sheet
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSheetConnector}
                className="inline-flex items-center px-3.5 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm uppercase tracking-wider"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                CONNECT GOOGLE SHEET
              </button>
            )}

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'ML'}`}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded border border-slate-700 object-cover"
                />
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-[10px] text-slate-400 uppercase">User</p>
                  <p className="text-xs font-bold text-slate-200">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSheetConnector}
                className="text-xs text-slate-300 hover:text-white underline font-semibold ml-1"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
