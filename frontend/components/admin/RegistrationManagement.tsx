
import React, { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {EyeVisibleIcon,ExportIcon,PlusIcon,CalendarIcon,ChevronDownIcon,RightArrowIcon,ArrowLeftIcon } from '@/components/icons';

import { RegistrationUser } from '@/lib/types';

const RegistrationManagement: React.FC = () => {
  // Dummy Data
  const [users, setUsers] = useState<RegistrationUser[]>([
    { id: '1', name: 'Monishwar Rajasekaran', avatar: 'https://i.pravatar.cc/150?u=1', gender: 'Male', email: 'aarav.krishnan@gmail.com', mobile: '8787627634', status: true },
    { id: '2', name: 'Diya Ramesh', avatar: 'https://i.pravatar.cc/150?u=2', gender: 'Female', email: 'diya.ramesh@outlook.com', mobile: '9890176543', status: true },
    { id: '3', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=3', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
    { id: '4', name: 'Meera Vishwanath', avatar: 'https://i.pravatar.cc/150?u=4', gender: 'Female', email: 'meera.vishu@icloud.com', mobile: '9448822109', status: true },
    { id: '5', name: 'Pranav Arul', avatar: 'https://i.pravatar.cc/150?u=5', gender: 'Male', email: 'pranav.arul23@yahoo.com', mobile: '8147263985', status: true },
    { id: '6', name: 'Monishwar Rajasekaran (M)', avatar: 'https://i.pravatar.cc/150?u=6', gender: 'Male', email: 'aarav.krishnan@gmail.com', mobile: '8787627634', status: true },
    { id: '7', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=7', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
    { id: '8', name: 'Diya Ramesh', avatar: 'https://i.pravatar.cc/150?u=8', gender: 'Female', email: 'diya.ramesh@outlook.com', mobile: '9890176543', status: true },
    { id: '9', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=9', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
    { id: '10', name: 'Karthik Suresh', avatar: 'https://i.pravatar.cc/150?u=10', gender: 'Male', email: 'karthik.suresh2001@gmail.com', mobile: '9092345567', status: true },
  ]);

  const toggleStatus = (id: string) => {
    setUsers(users.map(user => user.id === id ? { ...user, status: !user.status } : user));
  };

  return (
    <div className="flex flex-col h-full w-full gap-6 font-sans">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">
          <span>Dashboard</span>
          <span className="mx-2">{'>'}</span>
          <span className="text-brand-green font-medium">My Employees</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-light-primary dark:text-white">Registrations & Assessment Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
        <button className="px-1 py-3 mr-8 text-sm sm:text-base font-semibold text-brand-green border-b-2 border-brand-green">
          Registrations (1676)
        </button>
        <button className="px-1 py-3 text-sm sm:text-base font-medium text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-text-light-primary dark:hover:text-white transition-colors">
          Assign Assessment (540)
        </button>
      </div>

      {/* Controls / Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <input 
            type="text" 
            placeholder="Search by name, mobile, or Origin ID..." 
            className="w-full bg-transparent border border-brand-light-tertiary dark:border-brand-dark-tertiary rounded-lg py-2.5 pl-4 pr-10 text-sm text-brand-text-light-primary dark:text-white placeholder-brand-text-light-secondary dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity">
            <CalendarIcon className="w-4 h-4 text-brand-green" />
            <span>Today</span>
            <ChevronDownIcon className="w-3 h-3 ml-1" />
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity">
            <span>Excel Export</span>
            <div className="bg-[#107C41] p-0.5 rounded text-white">
               <ExportIcon className="w-3 h-3" />
            </div>
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-[#1A3A2C] border border-transparent dark:border-[#1A3A2C] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity">
            <span>Bulk Registration</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-bold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20">
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary bg-brand-light-primary dark:bg-brand-dark-primary">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-brand-light-secondary dark:bg-[#1A1D21] text-left">
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Name
                  <div className="flex flex-col text-[10px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Gender
                  <div className="flex flex-col text-[10px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Email
                  <div className="flex flex-col text-[10px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Mobile
                  <div className="flex flex-col text-[10px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer text-center">
                 <div className="flex items-center gap-1 justify-center">
                  Status
                  <div className="flex flex-col text-[10px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
            {users.map((user, index) => (
              <tr key={user.id} className={`hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary/50 transition-colors ${index % 2 === 0 ? 'bg-brand-light-primary dark:bg-[#1A1D21]' : 'bg-brand-light-secondary/30 dark:bg-[#1e2126]'}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary" />
                    <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                  {user.gender}
                </td>
                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                  {user.email}
                </td>
                <td className="p-4 text-sm text-brand-text-light-primary dark:text-white">
                  {user.mobile}
                </td>
                <td className="p-4 flex justify-center">
                  <ToggleSwitch isOn={user.status} onToggle={() => toggleStatus(user.id)} />
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors">
                    <EyeVisibleIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-2">
        <div className="flex gap-4">
          <a href="#" className="hover:text-brand-green transition-colors underline">Privacy Policy</a>
          <a href="#" className="hover:text-brand-green transition-colors underline">Terms & Conditions</a>
        </div>

        <div className="flex items-center gap-4">
          <span>Showing <span className="text-brand-text-light-primary dark:text-white font-semibold">10</span> of 1676 entries</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg bg-brand-light-tertiary dark:bg-brand-dark-tertiary hover:opacity-80 transition-opacity">
              <ArrowLeftIcon className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-brand-green text-white font-bold flex items-center justify-center shadow-lg shadow-brand-green/20">1</button>
            <button className="w-8 h-8 rounded-lg bg-transparent hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors text-brand-text-light-primary dark:text-white font-medium flex items-center justify-center">2</button>
            <button className="w-8 h-8 rounded-lg bg-transparent hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors text-brand-text-light-primary dark:text-white font-medium flex items-center justify-center">3</button>
            <button className="w-8 h-8 rounded-lg bg-transparent hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors text-brand-text-light-primary dark:text-white font-medium flex items-center justify-center">4</button>
            <span className="px-1">...</span>
            <button className="w-8 h-8 rounded-lg bg-transparent hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors text-brand-text-light-primary dark:text-white font-medium flex items-center justify-center">144</button>
            <button className="p-1.5 rounded-lg bg-brand-light-tertiary dark:bg-brand-dark-tertiary hover:opacity-80 transition-opacity">
              <RightArrowIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="text-right opacity-60 hidden sm:block">
          &copy; 2025 Origin BI, Made with by <span className="underline">Touchmark Descience Pvt Ltd</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationManagement;
