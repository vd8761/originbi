"use client";

import React from "react";
import Header from "@/components/corporate/Header";
import RegistrationManagement from "@/components/corporate/RegistrationManagement";
import { useRouter } from "next/navigation";

export default function RegistrationsPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Redirect to corporate login (or wherever you prefer)
    router.push("/corporate/login");
  };

  const handleNavigate = (
    view: "dashboard" | "assessment" | "registrations"
  ) => {
    if (view === "dashboard") router.push("/corporate/dashboard");
    if (view === "registrations") router.push("/corporate/registrations");
    // "assessment" is not used for corporate now, so we can safely ignore it
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        onLogout={handleLogout}
        currentView="registrations"
        portalMode="corporate"
        onNavigate={handleNavigate}
      />
      <main className="p-6">
        <RegistrationManagement />
      </main>
    </div>
  );
}
