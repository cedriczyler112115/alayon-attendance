import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Protocol Priority',
        href: '/settings/protocol-priority',
        icon: null,
    },
    {
        title: 'Announcer Settings',
        href: '/settings/announcer',
        icon: null,
    },
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isProtocolPriority = isCurrentOrParentUrl('/settings/protocol-priority');

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-8 xl:space-x-12 w-full">
                <aside className="w-full max-w-xl lg:w-48 xl:w-56 shrink-0">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div
                    className={cn(
                        'flex-1 min-w-0',
                        isProtocolPriority
                            ? 'w-full max-w-none'
                            : 'md:max-w-2xl'
                    )}
                >
                    <section
                        className={cn(
                            'space-y-12',
                            isProtocolPriority
                                ? 'w-full max-w-none'
                                : 'max-w-xl'
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
