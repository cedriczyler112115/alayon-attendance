import { Link } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 bg-background/95 px-4 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Mobile View: Quick link to Menu */}
            <div className="flex items-center gap-1.5 md:hidden">
                <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-2xs"
                >
                    <Link href="/menu" prefetch>
                        <LayoutGrid className="size-3.5" />
                        <span>Menu</span>
                    </Link>
                </Button>
            </div>
        </header>
    );
}
