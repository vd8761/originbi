import React, { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import {EyeVisibleIcon,ExcelIcon,BulkUploadIcon,PlusIcon,CalendarIcon,ChevronDownIcon,RightArrowIcon,ArrowLeftIcon } from '@/components/icons';
import AddRegistrationForm from '@/components/admin/AddRegistrationForm';
import { RegistrationUser } from '@/lib/types';

const RegistrationManagement: React.FC = () => {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [activeTab, setActiveTab] = useState<'registrations' | 'assigned'>('registrations');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);

  // Mock data for Registrations
  const [registrationUsers, setRegistrationUsers] = useState<RegistrationUser[]>([
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
    { id: '11', name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=11', gender: 'Female', email: 'sarah.j@gmail.com', mobile: '9876543210', status: false },
    { id: '12', name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=12', gender: 'Male', email: 'mike.ross@pearson.com', mobile: '8877665544', status: true },
  ]);

  // Mock data for Assigned Assessments (Subset or different state for demo)
  const [assignedUsers, setAssignedUsers] = useState<RegistrationUser[]>([
      { id: '1', name: 'Monishwar Rajasekaran', avatar: 'https://i.pravatar.cc/150?u=1', gender: 'Male', email: 'aarav.krishnan@gmail.com', mobile: '8787627634', status: true },
      { id: '4', name: 'Meera Vishwanath', avatar: 'https://i.pravatar.cc/150?u=4', gender: 'Female', email: 'meera.vishu@icloud.com', mobile: '9448822109', status: true },
      { id: '5', name: 'Pranav Arul', avatar: 'https://i.pravatar.cc/150?u=5', gender: 'Male', email: 'pranav.arul23@yahoo.com', mobile: '8147263985', status: false },
  ]);

  const toggleStatus = (id: string) => {
    if (activeTab === 'registrations') {
        setRegistrationUsers(registrationUsers.map(user => user.id === id ? { ...user, status: !user.status } : user));
    } else {
        setAssignedUsers(assignedUsers.map(user => user.id === id ? { ...user, status: !user.status } : user));
    }
  };

  const currentList = activeTab === 'registrations' ? registrationUsers : assignedUsers;
  const totalCount = activeTab === 'registrations' ? 1676 : 540; // Hardcoded total for demo as per screenshot

  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentItems = currentList.slice(indexOfFirstItem, indexOfLastItem);
  
  // Simulation of total pages based on the hardcoded "totalCount" from screenshot, 
  // but limited by actual mock data length for safety in this demo, 
  // or we can just mock the page count to match the screenshot (144 pages).
  const totalPages = Math.ceil(totalCount / entriesPerPage);

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
      }
  };

  // Logic to generate pagination numbers with ellipsis
  const getPaginationNumbers = () => {
      const pageNumbers = [];
      const maxVisibleButtons = 5;

      if (totalPages <= maxVisibleButtons + 2) {
          for (let i = 1; i <= totalPages; i++) {
              pageNumbers.push(i);
          }
      } else {
          // Always show first
          pageNumbers.push(1);

          if (currentPage > 3) {
              pageNumbers.push('...');
          }

          // Calculate center range
          let start = Math.max(2, currentPage - 1);
          let end = Math.min(totalPages - 1, currentPage + 1);

          // Adjust if close to beginning
          if (currentPage <= 3) {
              start = 2;
              end = 4;
          }
          
          // Adjust if close to end
          if (currentPage >= totalPages - 2) {
              start = totalPages - 3;
              end = totalPages - 1;
          }

          for (let i = start; i <= end; i++) {
              pageNumbers.push(i);
          }

          if (currentPage < totalPages - 2) {
              pageNumbers.push('...');
          }

          // Always show last
          pageNumbers.push(totalPages);
      }
      return pageNumbers;
  };

  if (view === 'add') {
      return (
          <AddRegistrationForm 
            onCancel={() => setView('list')} 
            onRegister={() => {
                setView('list');
            }}
          />
      );
  }

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

      {/* Tabs & Top Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-brand-dark-tertiary pb-0 gap-4 xl:gap-0">
        <div className="flex items-center w-full xl:w-auto">
            <button 
            onClick={() => { setActiveTab('registrations'); setCurrentPage(1); }}
            className={`px-1 py-3 mr-8 text-sm sm:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'registrations' ? 'text-brand-green border-brand-green' : 'text-brand-text-light-secondary dark:text-brand-text-secondary border-transparent hover:text-brand-text-light-primary dark:hover:text-white'}`}
            >
            Registrations (1676)
            </button>
            <button 
            onClick={() => { setActiveTab('assigned'); setCurrentPage(1); }}
            className={`px-1 py-3 text-sm sm:text-base font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assigned' ? 'text-brand-green border-brand-green' : 'text-brand-text-light-secondary dark:text-brand-text-secondary border-transparent hover:text-brand-text-light-primary dark:hover:text-white'}`}
            >
            Assign Assessment (540)
            </button>
        </div>

        {/* Showing Entries Control */}
        <div className="flex items-center gap-3 py-2">
            <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary hidden sm:inline">Showing</span>
            
            {/* Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                    className="flex items-center gap-2 bg-brand-light-tertiary dark:bg-[#303438] px-3 py-1.5 rounded-lg text-sm text-brand-text-light-primary dark:text-white font-medium min-w-[60px] justify-between"
                >
                    {entriesPerPage}
                    <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                </button>
                {showEntriesDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                        {[10, 25, 50, 100].map(num => (
                            <button 
                                key={num} 
                                onClick={() => { setEntriesPerPage(num); setShowEntriesDropdown(false); setCurrentPage(1); }}
                                className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary whitespace-nowrap">of {totalCount.toLocaleString()} entries</span>

            {/* Mini Navigation */}
            <div className="flex items-center gap-2 ml-2">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-[#303438] flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/20 transition-colors hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RightArrowIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
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
            <div className="bg-[#107C41] p-0.5 rounded text-white flex items-center justify-center">
               <ExcelIcon className="w-3 h-3" />
            </div>
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-tertiary dark:bg-[#1A3A2C] border border-transparent dark:border-[#1A3A2C] rounded-lg text-sm font-medium text-brand-text-light-primary dark:text-white hover:opacity-90 transition-opacity">
            <span>Bulk Registration</span>
            <BulkUploadIcon className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setView('add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green rounded-lg text-sm font-bold text-white hover:bg-brand-green/90 transition-opacity shadow-lg shadow-brand-green/20"
          >
            <span>Add New</span>
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary bg-brand-light-primary dark:bg-brand-dark-primary min-h-[400px]">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-brand-light-secondary dark:bg-[#1A1D21] text-left">
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Name
                  <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Gender
                  <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Email
                  <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer">
                 <div className="flex items-center gap-1">
                  Mobile
                  <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
                    <span>▲</span><span>▼</span>
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-semibold text-brand-text-light-secondary dark:text-brand-text-secondary uppercase tracking-wider cursor-pointer text-center">
                 <div className="flex items-center gap-1 justify-center">
                  Status
                  <div className="flex flex-col text-[8px] text-brand-text-light-secondary/50 dark:text-brand-text-secondary/50 leading-none">
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
            {currentItems.length > 0 ? (
                currentItems.map((user, index) => (
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
                ))
            ) : (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500">
                        No records found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pt-2">
        <div className="flex gap-4">
          <a href="#" className="hover:text-brand-green transition-colors underline">Privacy Policy</a>
          <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
          <a href="#" className="hover:text-brand-green transition-colors underline">Terms & Conditions</a>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-3 h-3" />
            </button>
            
            {getPaginationNumbers().map((page, index) => (
                <button 
                    key={index}
                    onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                    disabled={typeof page !== 'number'}
                    className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-colors border ${
                        currentPage === page 
                            ? 'bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/20' 
                            : typeof page === 'number' 
                                ? 'bg-transparent border-brand-light-tertiary dark:border-brand-dark-tertiary text-brand-text-light-primary dark:text-gray-400 hover:border-brand-text-light-secondary dark:hover:border-gray-500'
                                : 'border-transparent text-gray-500 cursor-default'
                    }`}
                >
                    {page}
                </button>
            ))}

            <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center text-brand-text-light-secondary dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RightArrowIcon className="w-3 h-3" />
            </button>
        </div>
        
        <div className="text-right opacity-60 hidden sm:block">
          &copy; 2025 Origin BI, Made with by <span className="underline hover:text-brand-green transition-colors cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationManagement;
