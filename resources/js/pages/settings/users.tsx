import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    Check,
    CheckCircle2,
    Crown,
    Filter,
    HelpCircle,
    LayoutGrid,
    Mail,
    Megaphone,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/types';

interface RoleOption {
    value: UserRole;
    label: string;
    description: string;
}

interface Props {
    users: User[];
    roles: RoleOption[];
    status?: string;
}

export default function UserLevelPage({ users = [], roles = [], status }: Props) {
    const { auth, errors } = usePage().props as { auth: { user: User }; errors: Record<string, string> };
    const currentUser = auth.user;
    const getInitials = useInitials();

    const [search, setSearch] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // Counts
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const hostCount = users.filter((u) => u.role === 'host').length;
    const staffCount = users.filter((u) => u.role === 'staff').length;

    // Filter users by search and role filter tab
    const filteredUsers = users.filter((u) => {
        const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
            query === '' ||
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query);

        return matchesRole && matchesSearch;
    });

    const handleRoleChange = (userId: number, newRole: UserRole) => {
        setUpdatingId(userId);
        router.put(
            `/settings/users/${userId}`,
            { role: newRole },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
            }
        );
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 px-2.5 py-0.5 text-xs font-semibold shadow-xs">
                        <Crown className="size-3" />
                        Admin
                    </Badge>
                );
            case 'host':
                return (
                    <Badge className="bg-sky-600 hover:bg-sky-700 text-white gap-1 px-2.5 py-0.5 text-xs font-semibold shadow-xs">
                        <Megaphone className="size-3" />
                        Host
                    </Badge>
                );
            case 'staff':
            default:
                return (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5 py-0.5 text-xs font-semibold shadow-xs">
                        <UserCheck className="size-3" />
                        Staff
                    </Badge>
                );
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Full access: All modules, settings & user privileges';
            case 'host':
                return 'Restricted to: Dashboard & Host Announcer console';
            case 'staff':
            default:
                return 'Restricted to: Attendance Registry & Dashboard';
        }
    };

    return (
        <>
            <Head title="User Levels & Role Privileges - Settings" />

            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
                    <div>
                        <Heading
                            variant="small"
                            title="User Levels & Role Privileges"
                            description="Configure role-based access control (Admin, Host, Staff) for all registered personnel."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-semibold py-1 px-3">
                            <Users className="size-3.5 mr-1.5 text-muted-foreground" />
                            {users.length} Total Users
                        </Badge>
                    </div>
                </div>

                {/* Status or Error Notifications */}
                {status && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 shadow-2xs">
                        <Check className="size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{status}</span>
                    </div>
                )}
                {errors?.role && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-center gap-2.5 shadow-2xs">
                        <ShieldAlert className="size-4.5 shrink-0" />
                        <span>{errors.role}</span>
                    </div>
                )}

                {/* 3-Pillar Summary Cards (Full Width 3-Column Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {/* Admin Level Card */}
                    <div
                        onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'admin' ? 'all' : 'admin')}
                        className={cn(
                            'cursor-pointer rounded-2xl border p-4 transition-all duration-150',
                            selectedRoleFilter === 'admin'
                                ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-500/30'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-300 dark:hover:border-purple-800'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                                    <Crown className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neutral-900 dark:text-white">Admin Level</div>
                                    <div className="text-[11px] text-muted-foreground">Full System Sovereignty</div>
                                </div>
                            </div>
                            <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                                {adminCount}
                            </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>Access: All Modules</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">Unrestricted</span>
                        </div>
                    </div>

                    {/* Host Level Card */}
                    <div
                        onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'host' ? 'all' : 'host')}
                        className={cn(
                            'cursor-pointer rounded-2xl border p-4 transition-all duration-150',
                            selectedRoleFilter === 'host'
                                ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 ring-2 ring-sky-500/30'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-sky-300 dark:hover:border-sky-800'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
                                    <Megaphone className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neutral-900 dark:text-white">Host Level</div>
                                    <div className="text-[11px] text-muted-foreground">Stage Emcee Console</div>
                                </div>
                            </div>
                            <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                                {hostCount}
                            </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>Access: Dashboard + Host</span>
                            <span className="font-semibold text-sky-600 dark:text-sky-400">2 Modules</span>
                        </div>
                    </div>

                    {/* Staff Level Card */}
                    <div
                        onClick={() => setSelectedRoleFilter(selectedRoleFilter === 'staff' ? 'all' : 'staff')}
                        className={cn(
                            'cursor-pointer rounded-2xl border p-4 transition-all duration-150',
                            selectedRoleFilter === 'staff'
                                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-300 dark:hover:border-emerald-800'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                    <UserCheck className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neutral-900 dark:text-white">Staff Level</div>
                                    <div className="text-[11px] text-muted-foreground">Reception & Registry</div>
                                </div>
                            </div>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                {staffCount}
                            </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>Access: Registry + Dashboard</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">2 Modules</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    {/* Role Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 w-fit">
                        <Button
                            variant={selectedRoleFilter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedRoleFilter('all')}
                            className={cn('h-8 text-xs font-semibold rounded-lg px-3')}
                        >
                            All Users ({users.length})
                        </Button>
                        <Button
                            variant={selectedRoleFilter === 'admin' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedRoleFilter('admin')}
                            className={cn(
                                'h-8 text-xs font-semibold rounded-lg px-3',
                                selectedRoleFilter === 'admin' && 'bg-purple-600 text-white hover:bg-purple-700'
                            )}
                        >
                            <Crown className="size-3 mr-1" />
                            Admins ({adminCount})
                        </Button>
                        <Button
                            variant={selectedRoleFilter === 'host' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedRoleFilter('host')}
                            className={cn(
                                'h-8 text-xs font-semibold rounded-lg px-3',
                                selectedRoleFilter === 'host' && 'bg-sky-600 text-white hover:bg-sky-700'
                            )}
                        >
                            <Megaphone className="size-3 mr-1" />
                            Hosts ({hostCount})
                        </Button>
                        <Button
                            variant={selectedRoleFilter === 'staff' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedRoleFilter('staff')}
                            className={cn(
                                'h-8 text-xs font-semibold rounded-lg px-3',
                                selectedRoleFilter === 'staff' && 'bg-emerald-600 text-white hover:bg-emerald-700'
                            )}
                        >
                            <UserCheck className="size-3 mr-1" />
                            Staff ({staffCount})
                        </Button>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs rounded-xl"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Full-Width Registered Users Table */}
                <div className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-neutral-50/80 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-6">User & Account</th>
                                    <th className="py-3.5 px-6">Email Address</th>
                                    <th className="py-3.5 px-6">Assigned Level & Scope</th>
                                    <th className="py-3.5 px-6 text-right">Assign User Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="size-8 text-muted-foreground/50" />
                                                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                    No users found
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    No user accounts match the current filter or search criteria.
                                                </p>
                                                {(search || selectedRoleFilter !== 'all') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearch('');
                                                            setSelectedRoleFilter('all');
                                                        }}
                                                        className="mt-2 text-xs h-8"
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const isSelf = user.id === currentUser?.id;
                                        const isUpdating = updatingId === user.id;

                                        return (
                                            <tr
                                                key={user.id}
                                                className={cn(
                                                    'hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors',
                                                    isUpdating && 'opacity-60 bg-neutral-100/50 dark:bg-neutral-800/30'
                                                )}
                                            >
                                                {/* Column 1: User & Avatar */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-9 rounded-xl">
                                                            <AvatarImage src={user.avatar} alt={user.name} />
                                                            <AvatarFallback className="rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
                                                                {getInitials(user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                                <span>{user.name}</span>
                                                                {isSelf && (
                                                                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20 px-1.5 py-0 rounded">
                                                                        You
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <Calendar className="size-3 text-muted-foreground/70" />
                                                                <span>
                                                                    Joined {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recently'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 2: Email */}
                                                <td className="py-4 px-6 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="size-3.5 text-muted-foreground/70 shrink-0" />
                                                        <span className="font-mono text-neutral-800 dark:text-neutral-200">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Column 3: Current Role Badge & Scope Description */}
                                                <td className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            {getRoleBadge(user.role)}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {getRoleDescription(user.role)}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 4: Role Assignment Select Dropdown */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="inline-flex items-center gap-2 justify-end">
                                                        <Select
                                                            value={user.role}
                                                            disabled={isUpdating}
                                                            onValueChange={(val) =>
                                                                handleRoleChange(user.id, val as UserRole)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-9 w-36 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700">
                                                                <SelectValue placeholder="Select level" />
                                                            </SelectTrigger>
                                                            <SelectContent align="end" className="w-56 rounded-xl">
                                                                <SelectItem value="admin">
                                                                    <div className="flex flex-col py-0.5">
                                                                        <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400 text-xs">
                                                                            <Crown className="size-3.5" />
                                                                            <span>Admin</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                            Full access to all modules & settings
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="host">
                                                                    <div className="flex flex-col py-0.5">
                                                                        <div className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400 text-xs">
                                                                            <Megaphone className="size-3.5" />
                                                                            <span>Host</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                            Dashboard & Host Announcer only
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="staff">
                                                                    <div className="flex flex-col py-0.5">
                                                                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                                                            <UserCheck className="size-3.5" />
                                                                            <span>Staff</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                            Attendance Registry & Dashboard only
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Permission Matrix Reference Card */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="size-4.5 text-primary" />
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                            System Access Privileges Reference Matrix
                        </h4>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="py-2.5 px-3">System Module / Area</th>
                                    <th className="py-2.5 px-3 text-center text-sky-600 dark:text-sky-400">
                                        <Megaphone className="size-3 inline mr-1" /> Host Level
                                    </th>
                                    <th className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400">
                                        <UserCheck className="size-3 inline mr-1" /> Staff Level
                                    </th>
                                    <th className="py-2.5 px-3 text-center text-purple-600 dark:text-purple-400">
                                        <Crown className="size-3 inline mr-1" /> Admin Level
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-muted-foreground">
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Dashboard & Event Statistics (/dashboard)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Host Stage Announcer Console (/host)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Attendance Registry & Print Sheets (/attendees)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Guest Categories Management (/categories)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Events Configuration (/events)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Protocol Seniority Ordering (/settings/protocol-priority)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        Announcer Audio Chime & TTS (/settings/announcer)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                                        User Level & Privilege Management (/settings/users)
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-rose-500 font-medium">Restricted (403)</td>
                                    <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

UserLevelPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Settings', href: '/settings' },
        { title: 'User Levels', href: '/settings/users' },
    ],
};
