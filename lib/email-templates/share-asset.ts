/**
 * Share Asset Email Template
 * 
 * Converted from React Email to pure TypeScript for Express/Vercel serverless compatibility.
 * The design matches emails/ShareAssetEmail.tsx exactly.
 */

import { EmailTheme } from './theme';

interface ShareAssetEmailProps {
    businessName: string;
    shareUrl: string;
    expiresAt?: string;
}

export function generateShareAssetEmailHtml({ businessName, shareUrl, expiresAt }: ShareAssetEmailProps): string {
    const previewText = `Print-Ready Asset from ${businessName}`;
    const expiryText = expiresAt
        ? `This link expires on ${new Date(expiresAt).toLocaleDateString()}.`
        : 'This link does not expire.';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewText}</title>
</head>
<body style="background-color: ${EmailTheme.colors.background}; font-family: ${EmailTheme.structure.fontFamily}; margin: 0; padding: 40px 20px;">
    <!-- Preview text (hidden) -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
    </div>
    
    <div style="background-color: ${EmailTheme.colors.surface}; border-radius: ${EmailTheme.structure.borderRadius}; padding: 40px; max-width: ${EmailTheme.structure.maxWidth}; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid ${EmailTheme.colors.border}; margin: 0 auto;">
        
        <!-- Logo Area -->
        <div style="margin-bottom: 32px; text-align: center;">
            <p style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: ${EmailTheme.colors.text};">
                Ads <span style="color: ${EmailTheme.colors.brand};">x</span> Create
            </p>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 24px; font-weight: 700; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0; text-align: center;">
            Print-Ready Asset 🎨
        </h1>

        <p style="font-size: 16px; line-height: 1.6; color: ${EmailTheme.colors.text}; margin: 0 0 24px 0; text-align: center;">
            <strong style="color: ${EmailTheme.colors.brand};">${businessName}</strong> has shared a print-ready asset with you.
            Click below to access and download in your preferred format.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="${shareUrl}" style="display: inline-block; background: ${EmailTheme.colors.brand}; color: #FFFFFF; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 6px rgba(109, 93, 252, 0.25);">
                Download Asset
            </a>
        </div>

        <!-- Expiry Note -->
        <p style="font-size: 14px; color: ${EmailTheme.colors.subtext}; text-align: center; margin: 0;">
            ${expiryText}
        </p>

        <hr style="border: none; border-top: 1px solid ${EmailTheme.colors.border}; margin: 32px 0;">

        <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center; margin: 0;">
            Powered by <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.brand};">Ads x Create</a>
        </p>

    </div>
</body>
</html>`;
}
