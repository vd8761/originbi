"use client";

import React from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/corporate/Header";
import CorporateDashboard from "@/components/corporate/CorporateDashboard";

export default function CorporateDashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    // After logout, go back to corporate login
    router.push("/corporate/login");
    sessionStorage.clear();
  };

  const handleNavigate = (
    view: "dashboard" | "assessment" | "registrations"
  ) => {
    if (view === "dashboard") {
      router.push("/corporate/dashboard");
    }

    if (view === "registrations") {
      // this is your “My Employees” / RegistrationManagement page
      router.push("/corporate/registrations");
    }

    // "assessment" you can hook later for corporate, so ignore for now
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        onLogout={handleLogout}
        currentView="dashboard"
        portalMode="corporate"
        onNavigate={handleNavigate}
      />

      <main className="p-6">
        <CorporateDashboard />
      </main>
    </div>
  );
}
