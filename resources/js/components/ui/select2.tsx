import { Check, ChevronDown, Search, X } from 'lucide-react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface Select2Option {
    value: string | number;
    label: string;
    description?: string;
    badge?: string;
}

export interface Select2Props {
    id?: string;
    name?: string;
    value: string | number | undefined | null;
    onChange: (value: any) => void;
    options: Select2Option[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    clearable?: boolean;
    className?: string;
    error?: string;
    autoFocusSearch?: boolean;
}

/**
 * Format ALL CAPS database strings into clean Title Case (e.g. AGUSAN DEL NORTE -> Agusan del Norte)
 */
function formatLabel(str: string): string {
    if (!str) return '';
    // If string is ALL CAPS and longer than 3 characters, convert to Title Case
    if (str === str.toUpperCase() && str.length > 3) {
        return str
            .toLowerCase()
            .split(' ')
            .map((word) => {
                if (['del', 'de', 'la', 'ng', 'sa', 'and', 'of'].includes(word)) {
                    return word;
                }
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }
    return str;
}

export function Select2({
    id,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option...',
    searchPlaceholder = 'Search...',
    disabled = false,
    loading = false,
    loadingText = 'Loading...',
    emptyText = 'No options available',
    clearable = false,
    className,
    error,
    autoFocusSearch = true,
}: Select2Props) {
    const generatedId = useId();
    const inputId = id || generatedId;

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Find currently selected option
    const selectedOption = useMemo(() => {
        if (value === undefined || value === null || value === '') return null;
        return options.find((opt) => String(opt.value) === String(value)) || null;
    }, [options, value]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return options;
        return options.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(query);
            const matchFormatted = formatLabel(opt.label).toLowerCase().includes(query);
            const matchDesc = opt.description ? opt.description.toLowerCase().includes(query) : false;
            const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(query) : false;
            return matchLabel || matchFormatted || matchDesc || matchBadge;
        });
    }, [options, search]);

    // Calculate placement (dropup vs dropdown) based on available viewport space
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow < 260 && spaceAbove > spaceBelow) {
                setPlacement('top');
            } else {
                setPlacement('bottom');
            }

            if (autoFocusSearch) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 30);
            }
        } else {
            setSearch('');
            setHighlightedIndex(0);
        }
    }, [isOpen, autoFocusSearch]);

    // Reset highlighted index when filtered options change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredOptions]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle option selection
    const handleSelect = (option: Select2Option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearch('');
        triggerRef.current?.focus();
    };

    // Handle clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
        setSearch('');
        triggerRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    return (
        <div ref={containerRef} className={cn('relative w-full text-left', isOpen && 'z-50', className)}>
            {name && <input type="hidden" name={name} value={value ?? ''} />}

            {/* Select2 Trigger Button */}
            <button
                ref={triggerRef}
                id={inputId}
                type="button"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={`${inputId}-listbox`}
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                onKeyDown={handleKeyDown}
                className={cn(
                    'flex h-9.5 w-full items-center justify-between rounded-lg border bg-white px-3 py-1.5 text-xs sm:text-sm text-foreground transition-all duration-150',
                    'border-neutral-300 shadow-2xs hover:border-neutral-400',
                    'focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-600',
                    disabled && 'cursor-not-allowed opacity-55 bg-neutral-100 dark:bg-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-none',
                    error && 'border-destructive focus:ring-destructive/20',
                    isOpen && 'border-primary ring-2 ring-primary/20 shadow-xs'
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                    {loading ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Spinner className="size-3.5" />
                            <span className="truncate text-xs">{loadingText}</span>
                        </div>
                    ) : selectedOption ? (
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                                {formatLabel(selectedOption.label)}
                            </span>
                            {selectedOption.badge && (
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                                    {selectedOption.badge}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <span className="truncate text-neutral-400 dark:text-neutral-500">{placeholder}</span>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1 pl-1 text-muted-foreground">
                    {clearable && selectedOption && !disabled && !loading && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={handleClear}
                            title="Clear selection"
                            className="rounded p-0.5 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            'size-4 text-neutral-400 transition-transform duration-200',
                            isOpen && 'rotate-180 text-primary'
                        )}
                    />
                </div>
            </button>

            {/* Select2 Dropdown Popover */}
            {isOpen && (
                <div
                    id={`${inputId}-listbox`}
                    role="listbox"
                    className={cn(
                        'absolute left-0 z-50 w-full min-w-full rounded-lg border border-neutral-200 bg-white shadow-xl',
                        'dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-neutral-950/70',
                        placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    )}
                >
                    {/* Embedded Search Box */}
                    <div className="border-b border-neutral-100 bg-neutral-50/75 p-2 dark:border-neutral-800 dark:bg-neutral-900/90">
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 size-3.5 text-neutral-400 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full rounded-md border border-neutral-300 bg-white pl-8 pr-7 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div ref={listRef} className="max-h-56 overflow-y-auto p-1 divide-y-0 text-xs">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-neutral-500">
                                <Spinner className="size-4" />
                                <span>{loadingText}</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-neutral-500">
                                {search ? (
                                    <span>
                                        No matches found for &quot;<strong className="text-foreground">{search}</strong>&quot;
                                    </span>
                                ) : (
                                    <span>{emptyText}</span>
                                )}
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = String(opt.value) === String(value);
                                const isHighlighted = idx === highlightedIndex;

                                return (
                                    <div
                                        key={opt.value}
                                        data-index={idx}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt)}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        className={cn(
                                            'relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 transition-colors',
                                            isHighlighted && !isSelected && 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
                                            isSelected && 'bg-primary/10 text-primary font-medium dark:bg-primary/25 dark:text-primary-foreground',
                                            !isHighlighted && !isSelected && 'text-neutral-700 dark:text-neutral-300'
                                        )}
                                    >
                                        <div className="flex flex-col truncate pr-2">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="truncate">{formatLabel(opt.label)}</span>
                                                {opt.badge && (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-[9px] uppercase tracking-wider">
                                                        {opt.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            {opt.description && (
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {opt.description}
                                                </span>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <Check className="size-4 shrink-0 text-primary" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Info showing count */}
                    {filteredOptions.length > 0 && (
                        <div className="border-t border-neutral-100 bg-neutral-50/60 px-3 py-1 text-[10px] text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/60 flex justify-between items-center">
                            <span>
                                {filteredOptions.length} {filteredOptions.length === 1 ? 'option' : 'options'}
                            </span>
                            {search && (
                                <span className="italic">filtered</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
