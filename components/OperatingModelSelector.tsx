import React from 'react';
import { Store, Globe, Truck, Calendar, Check } from 'lucide-react';
import { useThemeStyles, useNeuButtonProps } from '../components/NeuComponents';
import { motion } from 'framer-motion';

interface OperatingModelSelectorProps {
    value: 'storefront' | 'online' | 'service' | 'appointment';
    onChange: (value: 'storefront' | 'online' | 'service' | 'appointment') => void;
}

// Individual button wrapper to get correct hook state
const OperatingModelButton: React.FC<{
    opt: { id: string; label: string; desc: string; icon: any };
    isSelected: boolean;
    onClick: () => void;
    styles: any;
}> = ({ opt, isSelected, onClick, styles }) => {
    const motionProps = useNeuButtonProps(isSelected);
    const Icon = opt.icon;

    return (
        <motion.button
            onClick={onClick}
            {...motionProps}
            className={`
                relative p-5 rounded-2xl text-left transition-colors duration-300 outline-none
                ${styles.bg}
                ${isSelected ? 'ring-2 ring-brand/10' : ''}
            `}
        >
            {/* Header: Icon + Check */}
            <div className="flex justify-between items-start mb-4">
                <div className={`
                    p-3 rounded-xl transition-all duration-300
                    ${styles.bg}
                    ${styles.shadowOut}
                    ${isSelected ? 'text-brand' : 'text-gray-400'}
                `}>
                    <Icon size={22} />
                </div>

                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-brand bg-brand/10 p-1 rounded-full"
                    >
                        <Check size={14} strokeWidth={3} />
                    </motion.div>
                )}
            </div>

            {/* Text Content */}
            <div className={`font-bold text-sm mb-1 transition-colors ${isSelected ? 'text-brand' : styles.textMain}`}>
                {opt.label}
            </div>
            <div className={`text-xs transition-colors ${isSelected ? styles.textMain : styles.textSub}`}>
                {opt.desc}
            </div>
        </motion.button>
    );
};

export const OperatingModelSelector: React.FC<OperatingModelSelectorProps> = ({ value, onChange }) => {
    const { styles } = useThemeStyles();

    const options = [
        {
            id: 'storefront',
            label: 'Storefront',
            desc: 'Physical location customers visit',
            icon: Store
        },
        {
            id: 'online',
            label: 'Online Only',
            desc: 'E-commerce & digital services',
            icon: Globe
        },
        {
            id: 'service',
            label: 'Service Area',
            desc: 'We go to the customer',
            icon: Truck
        },
        {
            id: 'appointment',
            label: 'Appointment',
            desc: 'Booked visits & consultations',
            icon: Calendar
        }
    ] as const;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {options.map((opt) => (
                <OperatingModelButton
                    key={opt.id}
                    opt={opt}
                    isSelected={value === opt.id}
                    onClick={() => onChange(opt.id)}
                    styles={styles}
                />
            ))}
        </div>
    );
};
