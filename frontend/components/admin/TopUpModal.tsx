import React, { useState } from 'react';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, reason: string) => void;
    loading: boolean;
}

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
    const [amount, setAmount] = useState<string>('');
    const [reason, setReason] = useState('Top-up by Admin');
    const [remarks, setRemarks] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(amount, 10);
        if (val && !isNaN(val)) {
            // Pass remarks as the reason if provided, else default
            onSubmit(val, remarks || 'Top-up by Admin');
            setAmount('');
            setReason('');
            setRemarks('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top-up Credit</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Credit Count
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 50"
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Remarks <span className="text-gray-400 font-normal italic">(Optional)</span>
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="e.g. Additional credits for Q3"
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Processing...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TopUpModal;
