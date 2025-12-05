"use client";

import { useRouter } from 'next/navigation';
import Header from '@/components/admin/Header';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const router = useRouter();

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

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        currentView="dashboard"
        portalMode="admin"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="p-6">
        <AdminDashboard />
      </main>
    </div>
  );
}
