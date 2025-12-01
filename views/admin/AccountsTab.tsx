import React, { useState, useMemo, useEffect } from 'react';
import { Business } from '../../types';
import { useThemeStyles } from '../../components/NeuComponents';
import { Building2, Search, RefreshCw, ChevronLeft, ChevronRight, Wallet, CheckSquare, RotateCcw } from 'lucide-react';

// CreditRow Component (Moved from AdminDashboard.tsx)
const CreditRow: React.FC<{ business: Business; onUpdate: (id: string, amount: string) => void }> = ({ business, onUpdate }) => {
    const { styles, theme } = useThemeStyles();
    const [localCredits, setLocalCredits] = useState(business.credits.toString());
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setLocalCredits(business.credits.toString());
        setIsDirty(false);
    }, [business.credits]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalCredits(e.target.value);
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdate(business.id, localCredits);
        setIsDirty(false);
    };

    const handleReset = () => {
        setLocalCredits(business.credits.toString());
        setIsDirty(false);
    };

    const handleQuickAdd = (amount: number) => {
        const newVal = (parseInt(localCredits || '0') + amount).toString();
        setLocalCredits(newVal);
        setIsDirty(true);
    };

    return (
        <div className={`relative group p-4 rounded-2xl transition-all ${styles.bg} ${styles.shadowOut}`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="col-span-1 md:col-span-5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-gray-500 font-bold text-sm ${theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-200 to-white'} `}>
                        {business.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className={`font-bold ${styles.textMain} `}>{business.name}</h4>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles.bg} ${styles.shadowIn} ${styles.textSub} `}>
                                {business.type}
                            </span>
                            <span className={`text-[10px] ${styles.textSub} font-mono`}>
                                ID: {business.id.slice(0, 6)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                    <div className={`w-32 flex items-center gap-2 px-3 py-2 rounded-xl ${styles.bg} ${styles.shadowIn} border-2 ${isDirty ? 'border-yellow-500/50' : 'border-transparent'} transition-colors`}>
                        <Wallet size={14} className={isDirty ? "text-yellow-500" : "text-green-500"} />
                        <input
                            type="number"
                            value={localCredits}
                            onChange={handleChange}
                            className={`bg-transparent w-full font-mono font-bold text-sm focus:outline-none ${styles.textMain} `}
                        />
                    </div>
                    <div className="flex gap-1 w-20">
                        <button
                            onClick={handleSave}
                            disabled={!isDirty}
                            className={`w-9 h-9 rounded-xl shadow-md transition-all flex items-center justify-center ${isDirty
                                ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105 cursor-pointer'
                                : `${styles.bg} ${styles.shadowOut} text-gray-300 cursor-not-allowed opacity-50`
                                } `}
                            title="Save Changes"
                        >
                            <CheckSquare size={18} />
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={!isDirty}
                            className={`w-9 h-9 rounded-xl shadow-md transition-all flex items-center justify-center ${isDirty
                                ? 'bg-red-400 text-white hover:bg-red-500 hover:scale-105 cursor-pointer opacity-100'
                                : 'opacity-0 pointer-events-none'
                                } `}
                            title="Cancel Changes"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-3 flex justify-end gap-2">
                    {[10, 50, 100].map(amount => (
                        <button
                            key={amount}
                            onClick={() => handleQuickAdd(amount)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:text-yellow-500 ${styles.bg} ${styles.shadowOut} hover:${styles.shadowOutHover} `}
                        >
                            +{amount}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface AccountsTabProps {
    businesses: Business[];
    handleUpdateCredits: (id: string, amount: string) => void;
    handleRefresh: () => void;
    styles: any;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    currentPage: number;
    setCurrentPage: (val: number | ((prev: number) => number)) => void;
    itemsPerPage: number;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
    businesses,
    handleUpdateCredits,
    handleRefresh,
    styles,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    itemsPerPage
}) => {

    const filteredBusinesses = useMemo(() => {
        return businesses.filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.industry.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [businesses, searchTerm]);

    const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

    const paginatedBusinesses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBusinesses.slice(start, start + itemsPerPage);
    }, [filteredBusinesses, currentPage, itemsPerPage]);

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowIn} text-brand`}>
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain} `}>Business Accounts</h3>
                        <p className={`text-xs ${styles.textSub} `}>{filteredBusinesses.length} businesses found</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className={`absolute left-3 top-1/2 transform-translate-y-1/2 ${styles.textSub} `} />
                        <input
                            type="text"
                            placeholder="Search name, ID, industry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-bold focus:outline-none ${styles.bg} ${styles.shadowIn} ${styles.textMain} placeholder-gray-400`}
                        />
                    </div>
                    <button onClick={handleRefresh} className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} hover:text-brand transition-colors`}>
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase opacity-50 select-none">
                <div className="col-span-5">Business Details</div>
                <div className="col-span-3">Credits</div>
                <div className="col-span-4 text-right">Quick Actions</div>
            </div>

            <div className="space-y-4">
                {paginatedBusinesses.length === 0 && (
                    <div className={`text-center py-10 ${styles.textSub} `}>
                        No businesses found matching "{searchTerm}"
                    </div>
                )}
                {paginatedBusinesses.map((business) => (
                    <CreditRow key={business.id} business={business} onUpdate={handleUpdateCredits} />
                ))}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center gap-4 pt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className={`flex items-center px-4 font-bold ${styles.textSub} `}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};
