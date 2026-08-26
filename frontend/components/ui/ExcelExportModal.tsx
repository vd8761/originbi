import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

export interface ExcelExportColumn {
    /** Stable identifier, also the key looked up on each row. */
    key: string;
    /** Header text written into the sheet. */
    label: string;
    /** Ticked when the modal first opens. */
    defaultSelected?: boolean;
    /** Optional formatter; receives the raw row value and the whole row. */
    format?: (value: any, row: any) => any;
}

interface ExcelExportModalProps {
    open: boolean;
    onClose: () => void;
    /** Full superset of columns the user may pick from, in a sensible initial order. */
    columns: ExcelExportColumn[];
    rows: any[];
    /** File name without extension. */
    fileName: string;
    /** Sheet name; Excel caps this at 31 chars. */
    sheetName?: string;
    loading?: boolean;
    /** Shown above the picker, e.g. "97 candidates". */
    subtitle?: string;
}

/**
 * Excel Export dialog: tick the columns to include, drag them into the order you
 * want, download a real .xlsx. Column selection/order lives entirely in the
 * client - the caller just supplies the full row superset.
 */
const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
    open,
    onClose,
    columns,
    rows,
    fileName,
    sheetName = 'Sheet1',
    loading = false,
    subtitle,
}) => {
    // Working order of every column key; selection is tracked separately so
    // unticking a column keeps its position for when it is ticked again.
    const [order, setOrder] = useState<string[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [dragKey, setDragKey] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const columnMap = useMemo(() => {
        return columns.reduce<Record<string, ExcelExportColumn>>((acc, c) => {
            acc[c.key] = c;
            return acc;
        }, {});
    }, [columns]);

    // Reset to the caller's defaults every time the modal is opened.
    useEffect(() => {
        if (!open) return;
        setOrder(columns.map((c) => c.key));
        setSelected(
            columns.reduce<Record<string, boolean>>((acc, c) => {
                acc[c.key] = c.defaultSelected !== false;
                return acc;
            }, {}),
        );
        setDragKey(null);
    }, [open, columns]);

    if (!open) return null;

    const selectedKeys = order.filter((k) => selected[k]);
    const allSelected = order.length > 0 && selectedKeys.length === order.length;

    const toggle = (key: string) =>
        setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

    const toggleAll = () => {
        const next = !allSelected;
        setSelected(
            order.reduce<Record<string, boolean>>((acc, k) => {
                acc[k] = next;
                return acc;
            }, {}),
        );
    };

    /** Move `key` to the slot currently held by `targetKey`. */
    const moveTo = (key: string, targetKey: string) => {
        if (key === targetKey) return;
        setOrder((prev) => {
            const next = prev.filter((k) => k !== key);
            next.splice(next.indexOf(targetKey), 0, key);
            return next;
        });
    };

    const moveBy = (key: string, delta: number) => {
        setOrder((prev) => {
            const from = prev.indexOf(key);
            const to = from + delta;
            if (from < 0 || to < 0 || to >= prev.length) return prev;
            const next = [...prev];
            next.splice(to, 0, next.splice(from, 1)[0]);
            return next;
        });
    };

    const handleDownload = () => {
        if (selectedKeys.length === 0) return;
        setExporting(true);
        try {
            const header = selectedKeys.map((k) => columnMap[k]?.label ?? k);
            const body = rows.map((row) =>
                selectedKeys.map((k) => {
                    const col = columnMap[k];
                    const raw = row?.[k];
                    const value = col?.format ? col.format(raw, row) : raw;
                    return value === null || value === undefined ? '' : value;
                }),
            );

            const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
            // Width each column to its widest cell so nothing lands truncated.
            sheet['!cols'] = header.map((h, i) => ({
                wch: Math.min(
                    50,
                    Math.max(
                        12,
                        String(h).length + 2,
                        ...body.map((r) => String(r[i] ?? '').length + 2),
                    ),
                ),
            }));
            sheet['!freeze'] = { xSplit: 0, ySplit: 1 };

            const book = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31));
            XLSX.writeFile(book, `${fileName}.xlsx`);
            onClose();
        } finally {
            setExporting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-brand-dark-primary dark:text-white">
                        Excel Export
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-brand-text-secondary">
                        Tick the columns you need and drag them into the order you want.
                        {subtitle ? ` ${subtitle}` : ''}
                    </p>
                </div>

                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/10">
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-dark-primary dark:text-white cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="w-4 h-4 accent-brand-green cursor-pointer"
                        />
                        Select all
                    </label>
                    <span className="text-xs text-gray-500 dark:text-brand-text-secondary">
                        {selectedKeys.length} of {order.length} selected
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                    {loading ? (
                        <p className="p-6 text-center text-sm text-gray-500">Loading columns…</p>
                    ) : (
                        order.map((key, index) => {
                            const col = columnMap[key];
                            if (!col) return null;
                            return (
                                <div
                                    key={key}
                                    draggable
                                    onDragStart={() => setDragKey(key)}
                                    onDragEnd={() => setDragKey(null)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragKey) moveTo(dragKey, key);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${
                                        dragKey === key
                                            ? 'border-brand-green bg-brand-green/10'
                                            : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                                    }`}
                                >
                                    <span className="text-gray-400 select-none" aria-hidden>
                                        ⠿
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={!!selected[key]}
                                        onChange={() => toggle(key)}
                                        className="w-4 h-4 accent-brand-green cursor-pointer"
                                    />
                                    <span className="flex-1 text-sm text-brand-dark-primary dark:text-white">
                                        {col.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            aria-label={`Move ${col.label} up`}
                                            disabled={index === 0}
                                            onClick={() => moveBy(key, -1)}
                                            className="px-1.5 text-gray-400 hover:text-brand-green disabled:opacity-30 cursor-pointer disabled:cursor-default"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Move ${col.label} down`}
                                            disabled={index === order.length - 1}
                                            onClick={() => moveBy(key, 1)}
                                            className="px-1.5 text-gray-400 hover:text-brand-green disabled:opacity-30 cursor-pointer disabled:cursor-default"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={loading || exporting || selectedKeys.length === 0}
                        className="px-4 py-2 rounded-lg bg-brand-green text-white text-sm font-medium hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {exporting ? 'Preparing…' : 'Download .xlsx'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExcelExportModal;
