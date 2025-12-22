"use client";

import React from 'react';
import Header from '@/components/admin/Header';
import ProgramsManagement from '@/components/admin/ProgramsManagement';
import { useRouter } from 'next/navigation';
import RequireAdmin from '@/components/auth/RequireAdmin';   // 👈 add this

export default function RegistrationsPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/admin/login');
  };

  const handleNavigate = (
    view: 'dashboard' | 'programs' | 'corporate' | 'registrations'
  ) => {
    switch (view) {
      case 'dashboard':
        router.push('/admin/dashboard');
        break;
      case 'programs':
        router.push('/admin/programs');
        break;
      case 'corporate':
        router.push('/admin/corporate');
        break;
      case 'registrations':
        router.push('/admin/registrations');
        break;
    }
  };

  return (
    <RequireAdmin>   {/* 👈 protect this whole page */}
      <div className="min-h-screen bg-transparent">
        <Header
          onLogout={handleLogout}
          currentView={"programs" as any}
          portalMode="admin"
          onNavigate={handleNavigate as any}
        />
        <main className="">
          <ProgramsManagement />
        </main>
      </div>
    </RequireAdmin>
  );
}
