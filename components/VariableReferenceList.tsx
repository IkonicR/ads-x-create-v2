import React from 'react';
import { Copy } from 'lucide-react';
import { NeuCard, NeuButton } from './NeuComponents';

interface VariableGroup {
    title: string;
    vars: { token: string; desc: string }[];
}

const VARIABLES: VariableGroup[] = [
    {
        title: 'Core Data',
        vars: [
            { token: '{{BUSINESS_NAME}}', desc: 'Client Name' },
            { token: '{{GOAL}}', desc: 'Ad Goal (e.g. Awareness)' },
            { token: '{{LANGUAGE}}', desc: 'Target Language (e.g. Afrikaans)' },
            { token: '{{CONTACT_INFO}}', desc: 'Formatted Contacts (WhatsApp, etc.)' },
            { token: '{{LOCATION}}', desc: 'Location String' },
            { token: '{{HOURS}}', desc: 'Operating Hours' },
        ]
    },
    {
        title: 'Brand Kit',
        vars: [
            { token: '{{SLOGAN}}', desc: 'Slogan Text' },
            { token: '{{USAGE_RULE}}', desc: '"Always" / "Never" / "Sometimes"' },
            { token: '{{USPS}}', desc: 'Unique Selling Points list' },
            { token: '{{KEYWORDS}}', desc: 'SEO Keywords' },
            { token: '{{TONE}}', desc: 'Brand Tone' },
            { token: '{{COLOR_PRIMARY}}', desc: 'Primary Hex' },
            { token: '{{COLOR_SECONDARY}}', desc: 'Secondary Hex' },
            { token: '{{NEGATIVE_KEYWORDS}}', desc: 'Banned Words' },
        ]
    },
    {
        title: 'Campaign',
        vars: [
            { token: '{{VISUAL_PROMPT}}', desc: 'User Request' },
            { token: '{{PROMOTION}}', desc: 'Active Deal/Offer' },
            { token: '{{BENEFITS_LIST}}', desc: 'Product Benefits' },
            { token: '{{CTA}}', desc: 'Call to Action' },
            { token: '{{COMPLIANCE_TEXT}}', desc: 'Legal Disclaimer' },
        ]
    },
    {
        title: 'Visual Instructions',
        vars: [
            { token: '{{SUBJECT_INSTRUCTION}}', desc: 'How to handle Image 1 (Product/Hero)' },
            { token: '{{STYLE_INSTRUCTION}}', desc: 'Visual Style Directive' },
        ]
    }
];

export const VariableReferenceList: React.FC = () => {
    const handleCopyContext = () => {
        const text = VARIABLES.map(g =>
            `### ${g.title}\n` +
            g.vars.map(v => `- ${v.token}: ${v.desc}`).join('\n')
        ).join('\n\n');

        navigator.clipboard.writeText(text);
        alert('Variable Context copied! Paste this into ChatGPT to draft your prompt.');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Variable Reference</h4>
                <NeuButton onClick={handleCopyContext} variant="secondary" className="!py-1 !px-2 !text-[10px]">
                    <Copy size={12} className="mr-1" /> Copy Context
                </NeuButton>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {VARIABLES.map((group, i) => (
                    <div key={i}>
                        <h5 className="text-[10px] font-bold text-brand mb-2 uppercase opacity-70">{group.title}</h5>
                        <div className="space-y-1">
                            {group.vars.map((v, j) => (
                                <div key={j} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => navigator.clipboard.writeText(v.token)}
                                    title="Click to copy token">
                                    <code className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                        {v.token}
                                    </code>
                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors text-right">
                                        {v.desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
