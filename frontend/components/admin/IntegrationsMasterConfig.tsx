"use client";

import { useState, useEffect } from "react";
import { ToastContainer, ToastMessage } from "../ui/Toast";

interface MasterApp {
  id: string;
  name: string;
  display_name: string;
  is_globally_active: boolean;
}

export default function IntegrationsMasterConfig() {
  const [apps, setApps] = useState<MasterApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, title }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchApps = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL}/integrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('originbi_id_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      } else {
        const text = await res.text();
        addToast(`Failed to fetch apps: ${res.status} ${text}`, 'error');
      }
    } catch (error: any) {
      addToast(`Network Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL}/integrations/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('originbi_id_token')}`
        },
        body: JSON.stringify({ is_globally_active: !currentStatus })
      });
      
      if (res.ok) {
        setApps(apps.map(app => 
          app.id === id ? { ...app, is_globally_active: !currentStatus } : app
        ));
        addToast("Integration status updated", 'success');
      } else {
        addToast("Failed to update status", 'error');
      }
    } catch (error) {
      addToast("Failed to update status", 'error');
    }
  };

  const seedApps = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL}/integrations/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('originbi_id_token')}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        addToast(`Failed to seed: ${res.status} ${text}`, 'error');
      } else {
        addToast("Seed request sent successfully!", 'success');
        fetchApps();
      }
    } catch (error: any) {
      addToast(`Network Error on seed: ${error.message}`, 'error');
    }
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>
  );

  const getAppIconUrl = (name: string) => {
    // Custom overrides for icons that Google Favicons API fails to fetch correctly
    if (name === 'google_drive') return 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg';
    
    const map: Record<string, string> = {
      slack: 'slack.com',
      jira: 'atlassian.com',
      salesforce: 'salesforce.com',
      hubspot: 'hubspot.com',
      microsoft_teams: 'teams.microsoft.com',
      notion: 'notion.so',
      zoom: 'zoom.us',
      github: 'github.com',
      clickup: 'clickup.com',
      zoho_crm: 'zoho.com',
      asana: 'asana.com',
      trello: 'trello.com',
      monday: 'monday.com',
      zendesk: 'zendesk.com',
      freshdesk: 'freshdesk.com',
      gitlab: 'gitlab.com',
      bitbucket: 'bitbucket.org',
      workday: 'workday.com',
      bamboohr: 'bamboohr.com',
      gusto: 'gusto.com',
      deel: 'deel.com',
      adp: 'adp.com',
      rippling: 'rippling.com',
    };
    
    const domain = map[name] || `${name.replace('_', '')}.com`;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  return (
    <div className="p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Header (Action Only) */}
      <div className="flex justify-end items-center gap-4">
        <button 
          onClick={seedApps}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Seed Default Apps
        </button>
      </div>

      {/* Grid Layout */}
      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No integrations found</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Click the seed button above to initialize default apps.</p>
          <button 
            onClick={seedApps}
            className="text-brand-green hover:underline text-sm font-medium"
          >
            Initialize Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {apps.map((app) => (
            <div 
              key={app.id} 
              className={`group flex items-center justify-between bg-white dark:bg-[#19211C] border ${app.is_globally_active ? 'border-brand-green/40 shadow-sm dark:border-brand-green/30' : 'border-gray-200 dark:border-white/10'} rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:border-brand-green/50`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo Container */}
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-2 bg-white border border-gray-100 transition-all duration-300 ${!app.is_globally_active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100' : 'ring-2 ring-brand-green/20'}`}>
                  <img 
                    src={getAppIconUrl(app.name)} 
                    alt={app.display_name}
                    className="w-full h-full object-contain drop-shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-bold text-gray-400">${app.display_name.charAt(0)}</span>`;
                    }}
                  />
                </div>
                
                {/* App Info */}
                <div className="min-w-0 flex-1 pr-1">
                  <h3 className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {app.display_name}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono tracking-tight truncate mt-0.5">
                    {app.name}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${app.is_globally_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {app.is_globally_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="shrink-0 pl-2 border-l border-gray-100 dark:border-white/5 py-1 flex items-center justify-center">
                {/* Toggle Switch */}
                <button
                  onClick={() => toggleStatus(app.id, app.is_globally_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${app.is_globally_active ? 'bg-brand-green shadow-brand-green/30' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm ${app.is_globally_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
