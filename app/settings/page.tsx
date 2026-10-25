'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { importSessions } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importJsonText, setImportJsonText] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: Array<{ index: number; topic?: string; error: string }>;
  } | null>(null);

  const handleExportJson = () => {
    window.location.href = '/api/export?format=json';
    showSuccess('Preparing JSON export download...');
  };

  const handleExportCsv = () => {
    window.location.href = '/api/export?format=csv';
    showSuccess('Preparing CSV export download...');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      setImportReport(null);
    };
    reader.onerror = () => {
      showError('Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  const handleStartImport = () => {
    if (!importJsonText.trim()) {
      showError('Please select a JSON file or paste valid backup JSON.');
      return;
    }

    try {
      JSON.parse(importJsonText);
    } catch {
      showError('Invalid JSON format. Please verify the file contents.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      const parsed = JSON.parse(importJsonText);
      const payload = {
        ...parsed,
        duplicateStrategy,
      };

      const report: any = await importSessions(payload);
      setImportReport(report);
      showSuccess(
        `Import completed: ${report.inserted} inserted, ${report.updated} updated, ${report.skipped} skipped.`,
      );
      setIsConfirmOpen(false);
      setImportJsonText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showError(err.message || 'Import failed. Check format and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-[#333333]">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
          Settings & Data Management
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Export full backup copies of your speaking sessions or restore from a previous JSON backup.
        </p>
      </div>

      {/* Export Section */}
      <section className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-7 shadow-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#ececec] flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            Export Personal Records
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Download an offline archive of all your saved speaking sessions, topics, links, and results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* JSON Export */}
          <div className="p-4 rounded-xl bg-[#1c1c1c] border border-[#333333] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FileJson className="w-4 h-4 text-amber-400" />
                Complete JSON Backup
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Versioned JSON format containing all session fields, tags, and practice counters for migration or restore.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportJson}>
              <Download className="w-4 h-4 mr-1.5" />
              Download JSON
            </Button>
          </div>

          {/* CSV Export */}
          <div className="p-4 rounded-xl bg-[#1c1c1c] border border-[#333333] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Spreadsheet CSV File
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Compatible with Excel & Google Sheets. Protected against CSV formula injection.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-1.5" />
              Download CSV
            </Button>
          </div>
        </div>
      </section>

      {/* Import Section */}
      <section className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-7 shadow-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#ececec] flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Restore & Import Data
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Upload a valid JSON backup file previously exported from this application.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* File Picker */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              id="json-file-input"
            />
            <label
              htmlFor="json-file-input"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#333333] hover:bg-[#404040] text-gray-200 border border-[#444444] cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose JSON File
            </label>
            <span className="text-xs text-gray-400 truncate">
              {fileInputRef.current?.files?.[0]?.name || 'No file chosen'}
            </span>
          </div>

          {/* Or Paste JSON Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Or paste JSON contents directly:
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{ "version": "1.0.0", "sessions": [ ... ] }'
              className="w-full bg-[#1a1a1a] text-[#ececec] border border-[#383838] rounded-lg p-3 font-mono text-xs focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Duplicate Strategy Option */}
          <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#333333] space-y-2">
            <span className="text-xs font-semibold text-gray-300 block">
              Duplicate Links Handling
            </span>
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="skip"
                  checked={duplicateStrategy === 'skip'}
                  onChange={() => setDuplicateStrategy('skip')}
                  className="text-white focus:ring-0"
                />
                <span>Skip existing duplicate links (Safest)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="update"
                  checked={duplicateStrategy === 'update'}
                  onChange={() => setDuplicateStrategy('update')}
                  className="text-white focus:ring-0"
                />
                <span>Update / Overwrite existing sessions</span>
              </label>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartImport}
            disabled={!importJsonText.trim() || isImporting}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Validate & Import Records
          </Button>

          {/* Import Results Report */}
          {importReport && (
            <div className="p-4 rounded-xl bg-[#1c1c1c] border border-[#383838] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-[#ececec]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Import Results Summary
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-[#262626] border border-[#333333]">
                  <span className="text-gray-400 block">Total Records:</span>
                  <span className="font-bold text-gray-200">{importReport.total}</span>
                </div>
                <div className="p-2 rounded bg-[#262626] border border-[#333333]">
                  <span className="text-gray-400 block">Inserted:</span>
                  <span className="font-bold text-emerald-400">{importReport.inserted}</span>
                </div>
                <div className="p-2 rounded bg-[#262626] border border-[#333333]">
                  <span className="text-gray-400 block">Updated:</span>
                  <span className="font-bold text-blue-400">{importReport.updated}</span>
                </div>
                <div className="p-2 rounded bg-[#262626] border border-[#333333]">
                  <span className="text-gray-400 block">Skipped:</span>
                  <span className="font-bold text-amber-400">{importReport.skipped}</span>
                </div>
              </div>

              {importReport.errors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#333333]">
                  <span className="text-xs font-semibold text-rose-400">
                    Import Warnings / Errors ({importReport.errors.length}):
                  </span>
                  <ul className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                    {importReport.errors.map((err, idx) => (
                      <li key={idx} className="font-mono">
                        Item #{err.index} ({err.topic || 'Untitled'}): {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Security and Privacy Notice */}
      <section className="bg-[#1c1c1c] border border-[#333333] rounded-xl p-5 text-xs text-gray-400 space-y-2">
        <div className="flex items-center gap-2 text-gray-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Security & Privacy Assurance
        </div>
        <p className="leading-relaxed">
          Your saved ChatGPT links and practice scores are scoped strictly to your authenticated account in Cloudflare D1.
          This application never requests your OpenAI API keys, never connects to unauthorized external scrapers, and will not alter your ChatGPT conversations.
        </p>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmImport}
        isLoading={isImporting}
        isDestructive={duplicateStrategy === 'update'}
        title="Confirm Data Import"
        message={`Are you sure you want to proceed with importing records using the "${duplicateStrategy === 'update' ? 'Update existing' : 'Skip duplicates'}" strategy?`}
        confirmLabel="Proceed with Import"
      />
    </div>
  );
}
