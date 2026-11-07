import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                data-state={checked ? 'checked' : 'unchecked'}
                disabled={disabled}
                ref={ref}
                onClick={(e) => {
                    onClick?.(e);
                    if (!e.defaultPrevented && !disabled) {
                        onCheckedChange?.(!checked);
                    }
                }}
                className={cn(
                    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                    checked ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700',
                    className
                )}
                {...props}
            >
                <span
                    data-state={checked ? 'checked' : 'unchecked'}
                    className={cn(
                        'pointer-events-none block size-5 rounded-full bg-white shadow-md ring-0 transition-transform dark:bg-neutral-100',
                        checked ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
        );
    }
);
Switch.displayName = 'Switch';

export { Switch };

