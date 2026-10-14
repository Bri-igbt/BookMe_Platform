
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const LOGIN_PATH = '/admin/login';
const DASHBOARD_PATH = '/admin/dashboard';

function isAdminTokenUsable(token) {
    if (!token) return false;

    try {
        const payload = JSON.parse(
            atob(
                token
                    .split('.')[1]
                    .replace(/-/g, '+')
                    .replace(/_/g, '/')
            )
        );

        return (
            payload.role === 'admin' &&
            typeof payload.exp === 'number' &&
            payload.exp * 1000 > Date.now()
        );
    } catch {
        return false;
    }
}

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const validToken = isAdminTokenUsable(token);
        const isLoginPage = pathname === LOGIN_PATH;

        if (!validToken) {
            localStorage.removeItem('adminToken');

            if (isLoginPage) {
                setStatus('allowed');
            } else {
                setStatus('redirecting');
                router.replace(LOGIN_PATH);
            }

            return;
        }

        if (isLoginPage) {
            setStatus('redirecting');
            router.replace(DASHBOARD_PATH);
            return;
        }

        setStatus('allowed');
    }, [pathname, router]);

    if (status !== 'allowed') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Checking admin access...</p>
            </div>
        );
    }

    return children;
}
