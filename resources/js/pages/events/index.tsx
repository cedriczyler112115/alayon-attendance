import { Head, Link } from '@inertiajs/react';
import { Calendar, Plus, Tag } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface EventItem {
    id: number;
    title: string;
    theme?: string;
    venue?: string;
    event_date: string;
    status: 'active' | 'completed' | 'archived';
    attendees_count?: number;
    announced_count?: number;
}

interface Props {
    events: EventItem[];
}

export default function EventsIndexPage({ events = [] }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Events', href: '/events' }]}>
            <Head title="Events Management" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Events Management"
                        description="Manage assemblies, summits, and live attendance sessions."
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Card
                            key={event.id}
                            className="relative overflow-hidden"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Badge
                                        variant={
                                            event.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="text-xs font-semibold capitalize"
                                    >
                                        {event.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {event.event_date}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 line-clamp-1 text-base font-bold">
                                    {event.title}
                                </CardTitle>
                                {event.theme && (
                                    <CardDescription className="line-clamp-2 text-xs">
                                        {event.theme}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 text-xs">
                                {event.venue && (
                                    <div className="text-muted-foreground">
                                        <span className="font-semibold">
                                            Venue:
                                        </span>{' '}
                                        {event.venue}
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t pt-2 text-muted-foreground">
                                    <span>
                                        Attendees:{' '}
                                        <strong className="text-foreground">
                                            {event.attendees_count ?? 0}
                                        </strong>
                                    </span>
                                    <span>
                                        Announced:{' '}
                                        <strong className="text-foreground">
                                            {event.announced_count ?? 0}
                                        </strong>
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
