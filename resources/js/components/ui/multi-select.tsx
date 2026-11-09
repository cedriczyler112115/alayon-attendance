import { Check, ChevronDown, Search, X } from 'lucide-react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
    value: string | number;
    label: string;
    description?: string;
    badge?: string;
}

export interface MultiSelectProps {
    id?: string;
    name?: string;
    value: (string | number)[];
    onChange: (values: (string | number)[]) => void;
    options: MultiSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    className?: string;
    maxDisplayBadges?: number;
    allLabel?: string;
}

export function MultiSelect({
    id,
    value = [],
    onChange,
    options = [],
    placeholder = 'Select options...',
    searchPlaceholder = 'Search options...',
    disabled = false,
    clearable = true,
    className,
    maxDisplayBadges = 2,
    allLabel = 'All Selected',
}: MultiSelectProps) {
    const generatedId = useId();
    const inputId = id || generatedId;

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Normalize value to array of strings for consistent comparisons
    const selectedValuesSet = useMemo(() => {
        return new Set((value || []).map((v) => String(v)));
    }, [value]);

    // Selected options list
    const selectedOptions = useMemo(() => {
        return options.filter((opt) => selectedValuesSet.has(String(opt.value)));
    }, [options, selectedValuesSet]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return options;
        return options.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(query);
            const matchDesc = opt.description ? opt.description.toLowerCase().includes(query) : false;
            const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(query) : false;
            return matchLabel || matchDesc || matchBadge;
        });
    }, [options, search]);

    // Determine drop-up vs drop-down placement
    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
            setPlacement('top');
        } else {
            setPlacement('bottom');
        }
    }, [isOpen]);

    // Focus search input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 30);
        } else {
            setSearch('');
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleToggleOption = (optionValue: string | number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const strVal = String(optionValue);
        let nextValues: (string | number)[];
        if (selectedValuesSet.has(strVal)) {
            nextValues = value.filter((v) => String(v) !== strVal);
        } else {
            nextValues = [...value, optionValue];
        }
        onChange(nextValues);
    };

    const handleRemoveTag = (optionValue: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const strVal = String(optionValue);
        onChange(value.filter((v) => String(v) !== strVal));
    };

    const handleClearAll = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onChange([]);
    };

    const handleSelectAll = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onChange(options.map((o) => o.value));
    };

    const isAllSelected = options.length > 0 && selectedOptions.length === options.length;

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                id={inputId}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex min-h-9.5 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-left shadow-2xs transition-colors',
                    'hover:border-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-ring dark:hover:border-neutral-600',
                    isOpen && 'ring-1 ring-ring border-primary',
                    disabled && 'cursor-not-allowed opacity-50 bg-neutral-100 dark:bg-neutral-800'
                )}
            >
                <div className="flex flex-1 flex-wrap items-center gap-1 min-w-0 pr-1">
                    {selectedOptions.length === 0 ? (
                        <span className="text-muted-foreground truncate">{placeholder}</span>
                    ) : isAllSelected ? (
                        <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">
                            {allLabel} ({options.length})
                        </Badge>
                    ) : (
                        <>
                            {selectedOptions.slice(0, maxDisplayBadges).map((opt) => (
                                <Badge
                                    key={String(opt.value)}
                                    variant="secondary"
                                    className="text-[11px] font-medium px-1.5 py-0 gap-1 max-w-[150px] truncate"
                                >
                                    <span className="truncate">{opt.label}</span>
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        onClick={(e) => handleRemoveTag(opt.value, e)}
                                        className="hover:text-destructive hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded p-0.2 shrink-0 cursor-pointer"
                                    >
                                        <X className="size-2.5" />
                                    </span>
                                </Badge>
                            ))}
                            {selectedOptions.length > maxDisplayBadges && (
                                <Badge variant="outline" className="text-[10.5px] font-bold px-1.5 py-0 bg-neutral-50 dark:bg-neutral-800">
                                    +{selectedOptions.length - maxDisplayBadges} more
                                </Badge>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                    {clearable && selectedOptions.length > 0 && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            title="Clear selection"
                            onClick={handleClearAll}
                            className="p-0.5 rounded hover:bg-neutral-200 hover:text-foreground dark:hover:bg-neutral-700 cursor-pointer"
                        >
                            <X className="size-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={cn('size-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                </div>
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute left-0 z-50 w-full min-w-[280px] rounded-md border border-neutral-200 bg-popover text-popover-foreground shadow-lg dark:border-neutral-800',
                        placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                    )}
                >
                    {/* Search & Actions Header */}
                    <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full rounded border border-neutral-200 bg-background pl-8 pr-7 text-xs shadow-2xs outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-neutral-700"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Shortcuts */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                            <span>
                                {selectedOptions.length} of {options.length} selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-primary hover:underline font-semibold"
                                >
                                    Select All
                                </button>
                                <span className="opacity-40">•</span>
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="hover:text-destructive hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Options List */}
                    <div ref={listRef} className="max-h-60 overflow-y-auto p-1 text-xs">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No options match &ldquo;{search}&rdquo;
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isChecked = selectedValuesSet.has(String(opt.value));
                                return (
                                    <div
                                        key={String(opt.value)}
                                        onClick={(e) => handleToggleOption(opt.value, e)}
                                        className={cn(
                                            'flex items-center justify-between gap-2 rounded px-2.5 py-1.5 cursor-pointer transition-colors select-none',
                                            isChecked
                                                ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => handleToggleOption(opt.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="truncate">{opt.label}</span>
                                        </div>

                                        {opt.badge && (
                                            <Badge
                                                variant="outline"
                                                className="text-[9.5px] uppercase font-normal text-muted-foreground px-1 py-0 shrink-0"
                                            >
                                                {opt.badge}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

