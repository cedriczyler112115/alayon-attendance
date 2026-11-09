import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 text-primary bg-primary/10 rounded uppercase tracking-wider">
                        {user.userlevel || user.role || 'Staff'}
                    </span>
                </div>
                {showEmail ? (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                ) : (
                    <span className="truncate text-xs text-muted-foreground capitalize">
                        {user.userlevel || user.role || 'Staff'} Level
                    </span>
                )}
            </div>
        </>
    );
}
