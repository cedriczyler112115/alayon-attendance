export type UserRole = 'admin' | 'host' | 'staff';

export type User = {
    id: number;
    firstname?: string;
    middlename?: string | null;
    lastname?: string;
    name: string;
    email: string;
    role: UserRole;
    userlevel: string;
    is_admin?: boolean;
    is_host?: boolean;
    is_staff?: boolean;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
