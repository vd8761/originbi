"use client";

import React from "react";
import Header from "@/components/admin/Header";
import RegistrationManagement from "@/components/admin/RegistrationManagement";
import { useRouter } from "next/navigation";

export default function RegistrationsPage() {
  const router = useRouter();

  const handleNavigate = (
    view:
      | "dashboard"
      | "programs"
      | "corporate"
      | "registrations"
  ) => {
    switch (view) {
      case "dashboard":
        router.push("/admin/dashboard");
        break;
      case "programs":
        router.push("/admin/programs");
        break;
      case "corporate":
        router.push("/admin/corporate");
        break;
      case "registrations":
        router.push("/admin/registrations");
        break;
    }
  };

  const handleLogout = () => {
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        currentView="registrations"
        portalMode="admin"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="p-6">
        <RegistrationManagement />
      </main>
    </div>
  );
}
