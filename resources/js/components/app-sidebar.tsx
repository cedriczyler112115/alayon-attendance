import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Megaphone,
    Settings,
    Tag,
    Tv,
    UserCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Host Announcer',
        href: '/host',
        icon: Megaphone,
    },
    {
        title: 'Attendance Registry',
        href: '/attendees',
        icon: UserCheck,
    },
    {
        title: 'Guest Categories',
        href: '/categories',
        icon: Tag,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

const secondaryNavItems: NavItem[] = [
    {
        title: 'Big Screen Display',
        href: '/display',
        icon: Tv,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <div className="px-2 pt-4">
                    <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Live Modes
                    </div>
                    <NavMain items={secondaryNavItems} />
                </div>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
