import { Head, Link } from '@inertiajs/react';
import { Calendar, Plus, Tag } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Heading
                        title="Events Management"
                        description="Manage assemblies, summits, and live attendance sessions."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                        <Card key={event.id} className="relative overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Badge
                                        variant={event.status === 'active' ? 'default' : 'secondary'}
                                        className="capitalize text-xs font-semibold"
                                    >
                                        {event.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {event.event_date}
                                    </span>
                                </div>
                                <CardTitle className="text-base font-bold line-clamp-1 mt-2">
                                    {event.title}
                                </CardTitle>
                                {event.theme && (
                                    <CardDescription className="text-xs line-clamp-2">
                                        {event.theme}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="text-xs space-y-2 pt-0">
                                {event.venue && (
                                    <div className="text-muted-foreground">
                                        <span className="font-semibold">Venue:</span> {event.venue}
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                                    <span>Attendees: <strong className="text-foreground">{event.attendees_count ?? 0}</strong></span>
                                    <span>Announced: <strong className="text-foreground">{event.announced_count ?? 0}</strong></span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

