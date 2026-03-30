import React, { useState } from 'react';
import { api } from '../../lib/api';
import { 
  ArrowLeftWithoutLineIcon, 
  ArrowRightWithoutLineIcon,
  CalendarIcon 
} from '../icons';

interface ExtendAssessmentModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExtendAssessmentModal: React.FC<ExtendAssessmentModalProps> = ({
  session,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize "To" date to 7 days from now or current validTo if in future
  const initialToDate = new Date(
    Math.max(new Date(session.validTo).getTime(), new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
  );
  
  const [endDate, setEndDate] = useState<Date>(initialToDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(endDate.getFullYear(), endDate.getMonth(), 1));
  
  const [endTime, setEndTime] = useState({
    h: 11,
    m: 45,
    period: 'PM'
  });

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct final date
      const finalDate = new Date(endDate);
      let h = endTime.h;
      if (endTime.period === 'PM' && h !== 12) h += 12;
      if (endTime.period === 'AM' && h === 12) h = 0;
      finalDate.setHours(h, endTime.m, 0, 0);

      await api.put(`/admin/assessments/${session.id}/extend`, { newDate: finalDate.toISOString() });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update date');
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const startD = new Date(session.createdAt);
      const isStart = date.toDateString() === startD.toDateString();
      const isEnd = date.toDateString() === endDate.toDateString();
      const isSelected = isStart || isEnd;
      
      const checkTime = date.getTime();
      const sTime = new Date(startD.toDateString()).getTime();
      const eTime = new Date(endDate.toDateString()).getTime();
      const isInRange = checkTime > sTime && checkTime < eTime;
      
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={d}
          disabled={isPast}
          type="button"
          onClick={() => !isPast && setEndDate(date)}
          className={`h-9 w-9 text-xs font-medium flex flex-col items-center justify-center transition-all relative
            ${isPast ? 'opacity-20 cursor-not-allowed text-gray-400' : 'cursor-pointer'}
            ${isSelected && !isPast ? 'bg-brand-green text-white z-10 rounded-full' : ''}
            ${isInRange && !isPast ? 'bg-brand-green/10 text-brand-green dark:text-white rounded-none' : ''}
            ${!isSelected && !isInRange && !isPast ? 'text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5' : ''}
            ${isStart && eTime > sTime && !isPast ? 'rounded-r-none' : ''}
            ${isEnd && sTime < eTime && !isPast ? 'rounded-l-none' : ''}
          `}
        >
          <span className="leading-none">{d}</span>
          {isToday && !isSelected && !isPast && (
            <div className="w-1 h-1 bg-brand-green rounded-full mt-1" />
          )}
        </button>
      );
    }
    return days;
  };

  const TimeInput = ({ value, onChange, max }: { value: number, onChange: (v: number) => void, max: number }) => (
    <div className="flex bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 w-[52px] h-[42px] relative group overflow-hidden transition-colors">
      <input
        type="text"
        value={value.toString().padStart(2, '0')}
        readOnly
        className="bg-transparent text-gray-900 dark:text-white text-center text-sm font-medium w-full h-full focus:outline-none"
      />
      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center border-l border-gray-200 dark:border-white/5 w-4 bg-gray-100 dark:bg-[#2A2D32]">
        <button type="button" onClick={() => onChange(value >= max ? (max === 12 ? 1 : 0) : value + 1)} className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors">▲</button>
        <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5" />
        <button type="button" onClick={() => onChange(value <= (max === 12 ? 1 : 0) ? max : value - 1)} className="h-1/2 flex items-center justify-center text-[6px] text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors">▼</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-[740px] flex flex-col overflow-hidden animate-fade-in transition-colors duration-300">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-gray-900 dark:text-white font-bold text-sm">Update Expiration (End Date)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Calendar Side */}
          <div className="p-8 border-r border-gray-100 dark:border-white/5 flex-1 min-w-[320px]">
            <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-white/5 p-1.5 rounded-lg border border-gray-100 dark:border-white/5">
               <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
               >
                 <ArrowLeftWithoutLineIcon className="w-2 h-3 text-gray-400 dark:text-white/70 hover:text-gray-900 dark:hover:text-white" />
               </button>
               <span className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                 {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
               </span>
               <button 
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
               >
                 <ArrowRightWithoutLineIcon className="w-2 h-3 text-gray-400 dark:text-white/70 hover:text-gray-900 dark:hover:text-white" />
               </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center border-b border-gray-100 dark:border-white/5 pb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <div key={d} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center mt-2">
              {renderCalendar()}
            </div>
          </div>

          {/* Time & Info Side */}
          <div className="p-8 flex flex-col bg-gray-50 dark:bg-[#15171A] w-full md:w-[350px]">
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest block mb-4">Assessment Duration</label>
                
                {/* From (Read Only) */}
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex gap-1 uppercase">From (Original Start)</label>
                  <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 opacity-60">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {new Date(session.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* To (Editable) */}
                <div className="space-y-4">
                  <label className="text-[10px] text-brand-green font-bold flex gap-1 uppercase">To (New Expiration) <span className="text-red-500">*</span></label>
                  
                  <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-brand-green/20 dark:border-brand-green/40 mb-4 transition-colors">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-3.5 h-3.5 text-brand-green" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <TimeInput value={endTime.h} max={12} onChange={v => setEndTime({...endTime, h: v})} />
                    <span className="text-gray-400 dark:text-gray-500 font-bold">:</span>
                    <TimeInput value={endTime.m} max={59} onChange={v => setEndTime({...endTime, m: v})} />
                    <div className="flex bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden h-[42px] shrink-0">
                      <button 
                        type="button"
                        onClick={() => setEndTime({...endTime, period: 'AM'})}
                        className={`px-3 text-[11px] font-bold transition-all ${endTime.period === 'AM' ? 'bg-brand-green text-white' : 'text-gray-400 dark:text-gray-500'}`}
                      >AM</button>
                      <button 
                        type="button"
                        onClick={() => setEndTime({...endTime, period: 'PM'})}
                        className={`px-3 text-[11px] font-bold transition-all ${endTime.period === 'PM' ? 'bg-brand-green text-white' : 'text-gray-400 dark:text-gray-500'}`}
                      >PM</button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="pt-4 space-y-3">
                <button 
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full py-4 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Apply changes'}
                </button>
                <button type="button" onClick={onClose} className="w-full py-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white text-xs font-bold transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
