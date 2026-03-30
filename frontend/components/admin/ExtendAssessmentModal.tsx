import React, { useState } from 'react';
import { api } from '../../lib/api';

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
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtend = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.put(`/admin/assessments/${session.id}/extend`, { days });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to extend assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1C211E] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10">
        <div className="p-8">
          <h3 className="text-2xl font-bold text-[#19211C] dark:text-white mb-2">
            Extend Validity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Extend the assessment for <span className="font-semibold text-brand-green">{session.registration?.fullName || session.user?.email || 'Student'}</span>.
          </p>


          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Days
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all ${
                      days === d
                        ? 'bg-brand-green text-white'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={loading}
                className="flex-[2] py-3 bg-brand-green text-white rounded-xl font-bold hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
              >
                {loading ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
