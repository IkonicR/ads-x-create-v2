/**
 * Email Theme Configuration
 * 
 * Shared design tokens for all email templates.
 * This lives in lib/ so it can be properly bundled by Vercel serverless.
 */

export const EmailTheme = {
    colors: {
        brand: '#94ca42',
        brandGradient: 'linear-gradient(135deg, #94ca42, #7ab82a)',
        text: '#1C1C1E',
        subtext: '#6B7280',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        border: '#E5E7EB'
    },
    structure: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        borderRadius: '16px',
        maxWidth: '600px'
    }
};
