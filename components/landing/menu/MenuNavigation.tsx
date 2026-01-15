import React from 'react';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
    { label: 'Home', href: '#' },
    { label: 'Services', href: '#' },
    { label: 'Benefits', href: '#' },
    { label: 'Work', href: '#' },
    { label: 'Pricing', href: '#' },
    { label: 'Reviews', href: '#' },
    { label: 'FAQs', href: '#' },
    { label: 'Contact', href: '#' },
];

/**
 * MenuNavigation - Left column navigation list
 */
const MenuNavigation: React.FC = () => {
    return (
        <nav className="flex flex-col h-full px-8 md:px-10 py-8">
            <ul className="flex flex-col gap-6">
                {MENU_ITEMS.map((item, index) => (
                    <motion.li
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                    >
                        <a
                            href={item.href}
                            className="block text-2xl md:text-3xl font-bold text-white/50 hover:text-white transition-colors duration-300 cursor-pointer"
                        >
                            {item.label}
                        </a>
                        {/* Separator line - optional based on design, omitting for cleaner look per user image */}
                    </motion.li>
                ))}
            </ul>
        </nav>
    );
};

export default MenuNavigation;
