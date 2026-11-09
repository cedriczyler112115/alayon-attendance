import { Link, usePage } from '@inertiajs/react';
import {
    Crown,
    Palette,
    Shield,
    ShieldCheck,
    User as UserIcon,
    Users,
    Volume2,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem, User } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth?.user;
    const role = user?.role || 'staff';

    const isProtocolPriority = isCurrentOrParentUrl('/settings/protocol-priority');
    const isUsersPage = isCurrentOrParentUrl('/settings/users');
    const isWide = isProtocolPriority || isUsersPage;

    const sidebarNavItems: NavItem[] = [];

    // Protocol Priority (Admin only)
    if (role === 'admin') {
        sidebarNavItems.push({
            title: 'Protocol Priority',
            href: '/settings/protocol-priority',
            icon: Crown,
        });
        sidebarNavItems.push({
            title: 'User Levels',
            href: '/settings/users',
            icon: Users,
        });
    }

    // Announcer Settings (Host & Admin)
    if (role === 'admin' || role === 'host') {
        sidebarNavItems.push({
            title: 'Announcer Settings',
            href: '/settings/announcer',
            icon: Volume2,
        });
    }

    // Profile & Security (All Users)
    sidebarNavItems.push(
        {
            title: 'Profile',
            href: edit(),
            icon: UserIcon,
        },
        {
            title: 'Security',
            href: editSecurity(),
            icon: ShieldCheck,
        },
        {
            title: 'Appearance',
            href: editAppearance(),
            icon: Palette,
        }
    );

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
                                        <item.icon className="h-4 w-4 mr-2" />
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
                        isWide ? 'w-full max-w-none' : 'md:max-w-2xl'
                    )}
                >
                    <section
                        className={cn(
                            isWide ? 'w-full max-w-none space-y-6' : 'max-w-xl space-y-12'
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
