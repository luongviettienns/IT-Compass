import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { ExportColumn, ExportFormat } from '../../lib/adminExport';

export type ExportScope = 'current' | 'all' | 'selected' | 'range';

export type ExportModalConfig = {
  moduleLabel: string;
  filePrefix: string;
  totalRows: number;
  filteredRows: number;
  selectedRows?: number;
  supportsSelected?: boolean;
  supportsDateRange?: boolean;
  availableColumns: ExportColumn[];
  defaultScope?: ExportScope;
  defaultFormat?: ExportFormat;
  dateRangeLabel?: string;
  isGenerating?: boolean;
  errorMessage?: string | null;
  warningMessage?: string | null;
};

type AdminExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExport: (payload: { format: ExportFormat; scope: ExportScope; selectedColumnKeys: string[]; filePrefix: string }) => Promise<void> | void;
  config: ExportModalConfig;
};

const scopeLabels: Record<ExportScope, string> = {
  current: 'Dữ liệu đang lọc',
  all: 'Tất cả dữ liệu',
  selected: 'Các dòng đã chọn',
  range: 'Khoảng thời gian',
};

const formatLabels: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  xlsx: { label: 'XLSX', icon: <FileSpreadsheet className="h-4 w-4" /> },
  csv: { label: 'CSV', icon: <FileText className="h-4 w-4" /> },
};

export const AdminExportModal: React.FC<AdminExportModalProps> = ({ isOpen, onClose, onExport, config }) => {
  const defaultColumns = useMemo(() => config.availableColumns.filter((column) => column.defaultSelected !== false).map((column) => column.key), [config.availableColumns]);
  const [format, setFormat] = useState<ExportFormat>(config.defaultFormat ?? 'xlsx');
  const [scope, setScope] = useState<ExportScope>(config.defaultScope ?? 'current');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);
  const [filePrefix, setFilePrefix] = useState<string>(config.filePrefix);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setFormat(config.defaultFormat ?? 'xlsx');
      setScope(config.defaultScope ?? 'current');
      setSelectedColumns(defaultColumns);
      setFilePrefix(config.filePrefix);
    });
  }, [config.defaultFormat, config.defaultScope, config.filePrefix, defaultColumns, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const toggleColumn = (key: string) => {
    setSelectedColumns((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const submit = async () => {
    await onExport({ format, scope, selectedColumnKeys: selectedColumns, filePrefix });
  };

  const supportsSelected = config.supportsSelected ?? false;
  const supportsDateRange = config.supportsDateRange ?? false;
  const warning = config.warningMessage ?? (config.filteredRows > 1000 ? 'Dữ liệu lớn. Xuất bằng CSV có thể sẽ nhanh hơn.' : null);

  const isNoData = (scope === 'current' && config.filteredRows === 0) || (scope === 'all' && config.totalRows === 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[130] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl overflow-hidden rounded-[32px] border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b bg-background p-6">
                <div className="space-y-1">
                  <h2 id="export-modal-title" className="text-2xl font-black">Xuất dữ liệu {config.moduleLabel}</h2>
                  <p className="text-sm text-muted-foreground">Chọn định dạng, phạm vi và các cột trước khi tạo file.</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="rounded-full bg-secondary p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Đóng modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {(config.errorMessage || warning) ? (
                <div className={`border-b px-6 py-3 text-sm ${config.errorMessage ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-amber-500/20 bg-amber-500/5 text-amber-700'}`}>
                  {config.errorMessage ?? warning}
                </div>
              ) : null}

              <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  {/* Định dạng file */}
                  <section className="rounded-3xl border bg-background p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      <Download className="h-4 w-4" /> Định dạng file
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(Object.keys(formatLabels) as ExportFormat[]).map((key) => {
                        const item = formatLabels[key];
                        const active = format === key;
                        return (
                          <button 
                            key={key} 
                            type="button" 
                            onClick={() => setFormat(key)} 
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary/20 hover:bg-secondary/40'}`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Phạm vi xuất */}
                  <section className="rounded-3xl border bg-background p-5">
                    <div className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Phạm vi xuất</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(['current', 'all', 'selected', 'range'] as ExportScope[]).map((item) => {
                        const disabled = (item === 'selected' && !supportsSelected) || (item === 'range' && !supportsDateRange);
                        const active = scope === item;
                        return (
                          <button 
                            key={item} 
                            type="button" 
                            disabled={disabled} 
                            onClick={() => setScope(item)} 
                            className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-primary bg-primary/10' : 'bg-secondary/20 hover:bg-secondary/40'}`}
                          >
                            <div className="text-sm font-bold">{scopeLabels[item]}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item === 'current' && `${config.filteredRows} dòng trong bộ lọc`}
                              {item === 'all' && `${config.totalRows} dòng khả dụng`}
                              {item === 'selected' && `${config.selectedRows ?? 0} dòng đã chọn`}
                              {item === 'range' && (config.dateRangeLabel || 'Khoảng thời gian')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Cột dữ liệu */}
                  <section className="rounded-3xl border bg-background p-5">
                    <div className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Cột dữ liệu</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {config.availableColumns.map((column) => {
                        const checked = selectedColumns.includes(column.key);
                        return (
                          <button 
                            key={column.key} 
                            type="button" 
                            onClick={() => toggleColumn(column.key)} 
                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'border-primary bg-primary/10' : 'bg-secondary/20 hover:bg-secondary/40'}`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'}`}>
                              {checked ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="line-clamp-1 text-sm font-medium">{column.header}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-4 rounded-3xl border bg-secondary/10 p-5">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tóm tắt</div>
                    <div className="mt-2 text-lg font-black">Đã chọn {selectedColumns.length} cột</div>
                    <div className="mt-1 text-sm text-muted-foreground">Phạm vi: <span className="font-semibold text-foreground">{scopeLabels[scope]}</span></div>
                    <div className="mt-1 text-sm text-muted-foreground">Định: <span className="font-semibold text-foreground">{formatLabels[format].label}</span></div>
                  </div>

                  <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                    <div className="mb-2 font-bold text-foreground">Số lượng dòng</div>
                    <div className="flex justify-between"><span>Bộ lọc hiện tại:</span> <span>{config.filteredRows}</span></div>
                    <div className="flex justify-between"><span>Tổng cộng:</span> <span>{config.totalRows}</span></div>
                    {typeof config.selectedRows === 'number' ? <div className="flex justify-between font-medium text-primary"><span>Đã chọn:</span> <span>{config.selectedRows}</span></div> : null}
                  </div>

                  <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                    <div className="mb-3 font-bold text-foreground">Tiền tố tên file</div>
                    <Input
                      type="text"
                      value={filePrefix}
                      onChange={(e) => setFilePrefix(e.target.value)}
                      placeholder="Nhập tên file..."
                      className="h-9 text-xs"
                    />
                    <div className="mt-2 text-xs">Thời gian sẽ được nối vào cuối.</div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={submit} 
                    disabled={config.isGenerating || selectedColumns.length === 0 || isNoData || !filePrefix.trim()} 
                    className="w-full rounded-2xl py-6 font-bold"
                  >
                    {config.isGenerating ? 'Đang tạo file...' : <><Download className="mr-2 h-4 w-4" /> Xuất file</>}
                  </Button>
                </aside>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
