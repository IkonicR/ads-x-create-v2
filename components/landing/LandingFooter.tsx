import React from 'react';
import { Sparkles } from 'lucide-react';

const LandingFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Contact', href: '#' },
    ];

    return (
        <footer className="relative py-12 px-6 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-brand" />
                        </div>
                        <span className="text-sm font-medium text-white">Ads x Create</span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        {footerLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-neu-text-sub-dark hover:text-white transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-neu-text-sub-dark/50">
                        © {currentYear} Ads x Create. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
