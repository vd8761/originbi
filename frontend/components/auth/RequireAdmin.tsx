'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/aws-amplify-config';

configureAmplify();

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // 1️⃣ Check Cognito session
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        if (!tokens) {
          throw new Error('No tokens');
        }

        const idTokenJwt = tokens.idToken?.toString();
        if (!idTokenJwt) {
          throw new Error('No ID token');
        }

        // 2️⃣ Ask backend: /admin/me
        const apiBase =
          process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

        const res = await fetch(`${apiBase}/admin/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idTokenJwt}`,
          },
        });

        if (!res.ok) {
          throw new Error('Not admin or not allowed');
        }

        // ✅ All good – user is ADMIN and active
        setChecking(false);
      } catch (err) {
        console.error('RequireAdmin check failed:', err);

        // ❌ Not logged in / not admin / invalid session → log out + redirect
        try {
          await signOut();
        } catch {
          // ignore signOut errors
        }

        router.replace('/admin/login'); // adjust to your actual login route
      }
    };

    checkAdmin();
  }, [router]);

  if (checking) {
    // You can replace this with a spinner or skeleton
    return (
      <div className="w-full h-screen flex items-center justify-center text-sm text-gray-500">
        Checking your access…
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
