"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
interface TenantApp {
  id: string;
  name: string;
  display_name: string;
  status: string;
  features: any;
  configured_features: any;
  connectedAccount: string | null;
  connectedName: string | null;
  connectedPicture: string | null;
  connectedAt: string | null;
}

const CORPORATE_API = process.env.NEXT_PUBLIC_CORPORATE_API_URL;

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("accessToken");
  return null;
}

function getCurrentUserEmail(): string {
  try {
    if (typeof window === "undefined") return "";
    const email = sessionStorage.getItem("userEmail") || localStorage.getItem("userEmail");
    if (email) return email;
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.email || localStorage.getItem("originbi_user_email") || "";
  } catch {
    return "";
  }
}

function getAppIconUrl(name: string): string {
  if (name === "google_drive")
    return "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg";
  const map: Record<string, string> = {
    slack: "slack.com",
    jira: "atlassian.com",
    salesforce: "salesforce.com",
    hubspot: "hubspot.com",
    microsoft_teams: "teams.microsoft.com",
    notion: "notion.so",
    zoom: "zoom.us",
    github: "github.com",
    clickup: "clickup.com",
    zoho_crm: "zoho.com",
    asana: "asana.com",
    trello: "trello.com",
    monday: "monday.com",
    zendesk: "zendesk.com",
    freshdesk: "freshdesk.com",
    gitlab: "gitlab.com",
  };
  const domain = map[name] || `${name.replace(/_/g, "")}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function isGoogleApp(name: string) {
  return ["google_drive", "google_workspace", "gmail"].includes(name);
}

// ─────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────
export default function CorporateIntegrationsConfig() {
  const [apps, setApps] = useState<TenantApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [selectedApp, setSelectedApp] = useState<TenantApp | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oauthStep, setOauthStep] = useState<"initial" | "connecting" | "folder_selection">("initial");
  const [isSaving, setIsSaving] = useState(false);
  const [driveFolders, setDriveFolders] = useState<{ id: string, name: string }[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // Disconnect confirm
  const [disconnectTarget, setDisconnectTarget] = useState<TenantApp | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setIsLoading(true);
      const email = getCurrentUserEmail();
      const res = await fetch(
        `${CORPORATE_API}/corporate/integrations?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch integrations");
      const data = await res.json();
      setApps(data);
      return data as TenantApp[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDriveFolders = useCallback(async () => {
    setFoldersLoading(true);
    setDriveFolders([]);
    try {
      const email = getCurrentUserEmail();
      const url = `${CORPORATE_API}/corporate/integrations/google/files?email=${encodeURIComponent(email)}&search=folders_only`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setDriveFolders(data.files || []);
      }
    } catch {
      setDriveFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // ─── OAuth popup message listener ───
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const apiOrigin = CORPORATE_API ? new URL(CORPORATE_API).origin : window.location.origin;
      if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;
      if (event.data?.type === "OAUTH_SUCCESS") {
        setIsSaving(false);
        const freshApps = await fetchApps();
        if (selectedApp && isGoogleApp(selectedApp.name)) {
          // Update selectedApp to the freshly connected version
          const freshApp = freshApps.find(a => a.id === selectedApp.id);
          if (freshApp) setSelectedApp(freshApp);
          setOauthStep("folder_selection");
          setShowFolderSelector(true);
          fetchDriveFolders();
        } else {
          setIsModalOpen(false);
          setOauthStep("initial");
        }
      }
      if (event.data?.type === "OAUTH_ERROR") {
        setIsSaving(false);
        setOauthStep("initial");
        alert(`Connection failed: ${event.data.error}`);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fetchApps, selectedApp]);

  // ─── Launch Google OAuth popup ───
  const launchGoogleOAuth = (app: TenantApp) => {
    setIsSaving(true);
    setOauthStep("connecting");
    const email = getCurrentUserEmail();
    const oauthUrl = `${CORPORATE_API}/corporate/integrations/oauth/google/start?email=${encodeURIComponent(email)}&appId=${app.id}`;

    const popup = window.open(
      oauthUrl,
      "google_oauth",
      "width=520,height=620,scrollbars=yes,resizable=yes,top=100,left=200"
    );

    // Poll to detect if the popup was closed manually
    const pollTimer = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(pollTimer);
        setIsSaving(false);
        setOauthStep("initial");
      }
    }, 800);
  };

  // ─── Disconnect handler ───
  const handleDisconnect = async (app: TenantApp) => {
    try {
      const email = getCurrentUserEmail();
      const res = await fetch(
        `${CORPORATE_API}/corporate/integrations/${app.id}?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (!res.ok) throw new Error("Failed to disconnect");
      if (isGoogleApp(app.name)) {
        localStorage.removeItem('googleDriveSyncFolder');
        setSelectedSyncFolder(null);
      }
      setDisconnectTarget(null);
      await fetchApps();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openModal = (app: TenantApp) => {
    setSelectedApp(app);
    setOauthStep("initial");
    setIsModalOpen(true);
  };
  
  const [selectedSyncFolder, setSelectedSyncFolder] = useState<{ id: string, name: string } | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('googleDriveSyncFolder');
      if (saved) {
        try { setSelectedSyncFolder(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          App Integrations
        </h2>
        <p className="text-gray-500 mt-1.5">
          Connect and configure your authorized third-party applications.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="bg-white dark:bg-[#19211C] shadow-sm rounded-3xl p-16 text-center border border-gray-100 dark:border-white/10">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-gray-200 dark:border-white/10">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Integrations Available</h3>
          <p className="text-gray-400 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            Your organization has no integrations assigned. Contact your OriginBI administrator to enable apps.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apps.map((app) => {
            const hasFolderIfGoogle = isGoogleApp(app.name) ? !!(typeof window !== 'undefined' && localStorage.getItem('googleDriveSyncFolder')) : true;
            const isConnected = app.status === "connected" && hasFolderIfGoogle;
            return (
              <div
                key={app.id}
                className={`group relative bg-white dark:bg-[#19211C] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${
                  isConnected
                    ? "shadow-[0_0_0_1.5px_rgb(30,211,106,0.35),0_20px_60px_rgb(30,211,106,0.08)] hover:shadow-[0_0_0_2px_rgb(30,211,106,0.5),0_30px_80px_rgb(30,211,106,0.15)]"
                    : "shadow-[0_0_0_1px_rgb(0,0,0,0.07),0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_0_0_1px_rgb(0,0,0,0.1),0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                }`}
              >
                {/* Card header strip */}
                <div className={`h-1.5 w-full ${isConnected ? "bg-gradient-to-r from-brand-green to-emerald-400" : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10"}`} />

                <div className="p-6">
                  {/* Top row: icon + badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-3 transition-all duration-300 ${
                      isConnected
                        ? "bg-white shadow-lg shadow-gray-200/80 dark:shadow-black/30 ring-1 ring-gray-100 dark:ring-white/10"
                        : "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 saturate-0 opacity-50 group-hover:saturate-100 group-hover:opacity-100 group-hover:bg-white group-hover:shadow-md group-hover:shadow-gray-200/70"
                    }`}>
                      <img
                        src={getAppIconUrl(app.name)}
                        alt={app.display_name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>

                    {isConnected ? (
                      <div className="flex items-center gap-1.5 bg-brand-green/10 dark:bg-brand-green/15 text-brand-green rounded-full px-3 py-1 border border-brand-green/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wide uppercase">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-full px-3 py-1 border border-gray-200 dark:border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span className="text-[11px] font-bold tracking-wide uppercase">Inactive</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-[17px] font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                    {app.display_name}
                  </h3>

                  {/* Connected account or subtext */}
                  {isConnected && app.connectedAccount ? (
                    <div className="mt-2 flex items-center gap-2">
                      {app.connectedPicture ? (
                        <img src={app.connectedPicture} className="w-5 h-5 rounded-full ring-1 ring-brand-green/30" alt="" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-brand-green text-white text-[9px] font-black flex items-center justify-center">
                          {app.connectedAccount[0].toUpperCase()}
                        </div>
                      )}
                      <p className="text-[12px] text-gray-600 dark:text-gray-400 truncate font-semibold">
                        {app.connectedAccount}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[13px] text-gray-400 dark:text-gray-500 leading-snug">
                      {isConnected ? "Syncing data actively" : "Click to authorize access"}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="my-5 h-px bg-gray-100 dark:bg-white/5" />

                  {/* CTA row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(app)}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-bold tracking-tight transition-all duration-200 ${
                        isConnected
                          ? "bg-gray-50 hover:bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 border border-gray-200/70 dark:border-transparent"
                          : "bg-gradient-to-r from-brand-green to-emerald-500 text-white shadow-lg shadow-green-900/25 hover:shadow-green-900/40 hover:from-brand-green/95 hover:to-emerald-500/95"
                      }`}
                    >
                      {isConnected ? "Manage" : "Connect"}
                    </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Connection Modal ─── */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#19211C] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 dark:ring-white/10 p-2 flex items-center justify-center shrink-0">
                  <img src={getAppIconUrl(selectedApp.name)} alt={selectedApp.display_name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedApp.status === "connected" ? `Manage ${selectedApp.display_name}` : `Connect ${selectedApp.display_name}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedApp.status === "connected"
                      ? `Connected as ${selectedApp.connectedAccount}`
                      : "Authorize OriginBI to access your account"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setOauthStep("initial"); }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              {selectedApp.status === "connected" ? (
                /* ─── Already Connected View ─── */
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-brand-green/5 dark:bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4">
                    {selectedApp.connectedPicture ? (
                      <img src={selectedApp.connectedPicture} className="w-12 h-12 rounded-full ring-2 ring-brand-green/30" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-green/20 text-brand-green text-xl font-bold flex items-center justify-center">
                        {selectedApp.connectedAccount?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedApp.connectedName || "Connected Account"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedApp.connectedAccount}</p>
                      {selectedApp.connectedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Connected {new Date(selectedApp.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto">
                      <span className="w-7 h-7 bg-brand-green rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Active permissions:</p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Read and manage specific Drive files
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Connect to external web services
                      </li>
                    </ul>
                  </div>

                  {isGoogleApp(selectedApp.name) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Knowledge Base Folder</p>
                        {!showFolderSelector && !selectedSyncFolder && (
                          <button onClick={() => {
                            setShowFolderSelector(true);
                            fetchDriveFolders();
                          }} className="text-[13px] font-semibold text-brand-green hover:text-emerald-600 transition-colors">
                            Select Folder
                          </button>
                        )}
                      </div>
                      
                      {selectedSyncFolder ? (
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                            <div>
                              <p className="text-[14px] font-medium text-gray-900 dark:text-white">{selectedSyncFolder.name}</p>
                              <p className="text-[12px] text-gray-500">Synced to Ask AI context</p>
                            </div>
                          </div>
                          <button onClick={async () => {
                            setSelectedSyncFolder(null);
                            localStorage.removeItem('googleDriveSyncFolder');
                            try {
                              const email = getCurrentUserEmail();
                              await fetch(`${CORPORATE_API}/corporate/integrations/google/sync-folder?email=${encodeURIComponent(email)}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                body: JSON.stringify({ folderId: '', folderName: '' }),
                              });
                            } catch { /* ignore */ }
                          }} className="text-red-500 hover:text-red-700 p-2">✕</button>
                        </div>
                      ) : showFolderSelector ? (
                        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/10 space-y-2">
                            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Select a folder to sync</p>
                            <input 
                              type="text" 
                              placeholder="Search folders..."
                              value={folderSearchQuery}
                              onChange={(e) => setFolderSearchQuery(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto p-2">
                            {foldersLoading ? (
                              <div className="flex items-center justify-center py-6 gap-2">
                                <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-500">Loading your folders...</p>
                              </div>
                            ) : driveFolders.length > 0 ? driveFolders
                              .filter(f => f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()))
                              .map((folder) => (
                              <button 
                                key={folder.id}
                                onClick={async () => { 
                                  const f = { id: folder.id, name: folder.name };
                                  setSelectedSyncFolder(f); 
                                  localStorage.setItem('googleDriveSyncFolder', JSON.stringify(f));
                                  setShowFolderSelector(false); 
                                  setOauthStep("initial");
                                  setIsModalOpen(false);
                                  // Persist to backend — restricts AI to only this folder
                                  try {
                                    const email = getCurrentUserEmail();
                                    await fetch(`${CORPORATE_API}/corporate/integrations/google/sync-folder?email=${encodeURIComponent(email)}`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                      body: JSON.stringify({ folderId: folder.id, folderName: folder.name }),
                                    });
                                  } catch (e) { console.error('Failed to save folder to backend', e); }
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-left"
                              >
                                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                                <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{folder.name}</span>
                              </button>
                            )) : (
                              <div className="text-center py-4">
                                <p className="text-xs text-gray-400">No folders found in your Google Drive.</p>
                              </div>
                            )}
                            {!foldersLoading && driveFolders.filter(f => f.name.toLowerCase().includes(folderSearchQuery.toLowerCase())).length === 0 && driveFolders.length > 0 && (
                              <p className="text-xs text-center py-4 text-gray-400">No folders match your search.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-500">No folder is currently syncing. Click "Select Folder" to connect a knowledge base.</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    {isGoogleApp(selectedApp.name) && (
                      <button
                        onClick={() => launchGoogleOAuth(selectedApp)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                      >
                        Switch account
                      </button>
                    )}
                    <button
                      onClick={() => { setDisconnectTarget(selectedApp); setIsModalOpen(false); }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : oauthStep === "initial" ? (
                /* ─── Initial State ─── */
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md p-3 flex items-center justify-center ring-1 ring-gray-100">
                      <img src="/Origin-BI-Logo-01.png" alt="OriginBI" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-brand-green/30 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-pulse delay-75" />
                      <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse delay-150" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md p-3 flex items-center justify-center ring-1 ring-gray-100">
                      <img src={getAppIconUrl(selectedApp.name)} alt={selectedApp.display_name} className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    OriginBI would like to connect to {selectedApp.display_name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3 max-w-sm">
                    This integration allows OriginBI to securely sync candidate data, assessment results, and workflow actions with your {selectedApp.display_name} workspace.
                  </p>

                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 mb-8 text-left w-full">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      🔐 You will be redirected to {selectedApp.display_name} to sign in and grant permission. OriginBI never stores your password.
                    </p>
                  </div>

                  {isGoogleApp(selectedApp.name) ? (
                    <button
                      onClick={() => launchGoogleOAuth(selectedApp)}
                      className="w-full max-w-xs py-3.5 rounded-full text-sm font-bold text-white bg-brand-green hover:bg-brand-green/90 shadow-lg shadow-green-900/20 transition-all"
                    >
                      Continue to {selectedApp.display_name}
                    </button>
                  ) : (
                    <button className="w-full max-w-xs py-3.5 rounded-full text-sm font-bold text-white bg-brand-green hover:bg-brand-green/90 shadow-lg shadow-green-900/20 transition-all">
                      Continue to {selectedApp.display_name}
                    </button>
                  )}

                  <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    End-to-end encrypted · OAuth 2.0 standard
                  </p>
                </div>
              ) : (
                /* ─── Connecting/Waiting ─── */
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin mb-6" />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Opening {selectedApp.display_name}...</h4>
                  <p className="text-sm text-gray-500">
                    A popup window has opened. Please sign in and approve the permissions.
                  </p>
                  <button
                    onClick={() => { setOauthStep("initial"); setIsSaving(false); }}
                    className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Disconnect Confirm Modal ─── */}
      {disconnectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#19211C] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-white/10">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Disconnect {disconnectTarget.display_name}?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              This will remove the connection to <strong>{disconnectTarget.connectedAccount}</strong> and stop all syncing. You can reconnect at any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDisconnectTarget(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Keep connected
              </button>
              <button
                onClick={() => handleDisconnect(disconnectTarget)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/20 transition-all"
              >
                Yes, disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
