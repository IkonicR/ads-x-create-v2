/**
 * Team Invite Email Template
 * 
 * Converted from React Email to pure TypeScript for Vercel serverless compatibility.
 * The design matches emails/InviteEmail.tsx exactly.
 */

import { EmailTheme } from './theme';

interface InviteEmailProps {
    businessName: string; // Can be comma-separated list
    role: string;
    inviteLink: string;
}

export function generateInviteEmailHtml({ businessName, role, inviteLink }: InviteEmailProps): string {
    // Parse business names if comma-separated
    const businesses = businessName.split(',').map(s => s.trim()).filter(Boolean);
    const isMulti = businesses.length > 1;
    const previewText = isMulti
        ? `You've been invited to join ${businesses.length} workspaces`
        : `You've been invited to join ${businesses[0]}`;

    // Generate business list HTML
    const businessListHtml = businesses.map((biz, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; ${index !== businesses.length - 1 ? 'border-bottom: 1px solid #E5E7EB;' : ''}">
            <div style="display: flex; align-items: center;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background-color: ${EmailTheme.colors.brand}; color: #ffffff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                    ${biz.charAt(0).toUpperCase()}
                </div>
                <span style="margin: 0; font-size: 16px; font-weight: 600; color: ${EmailTheme.colors.text};">
                    ${biz}
                </span>
            </div>
            <span style="margin: 0; font-size: 12px; color: ${EmailTheme.colors.subtext}; background-color: #FFFFFF; padding: 4px 8px; border-radius: 6px; border: 1px solid #E5E7EB;">
                Active
            </span>
        </div>
    `).join('');

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

        <!-- Header Badge -->
        <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; padding: 8px 16px; background-color: #F3F4F6; border-radius: 20px; font-size: 12px; font-weight: 700; color: ${EmailTheme.colors.brand}; text-transform: uppercase; letter-spacing: 1px;">
                Official Invitation
            </span>
        </div>

        <!-- Main Heading -->
        <h1 style="font-size: 32px; font-weight: 800; color: ${EmailTheme.colors.text}; margin: 0 0 16px 0; text-align: center; letter-spacing: -1px; line-height: 1.2;">
            Welcome to the<br>
            <span style="color: ${EmailTheme.colors.brand};">Command Center</span>
        </h1>

        <p style="font-size: 16px; line-height: 1.6; color: ${EmailTheme.colors.subtext}; margin: 0 0 32px 0; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto;">
            You have been granted <strong>${role}</strong> access to the following workspace${isMulti ? 's' : ''}.
            Connect now to start collaborating.
        </p>

        <!-- Business List Card -->
        <div style="background-color: #F9FAFB; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB; margin-bottom: 32px; width: 100%; box-sizing: border-box;">
            ${businessListHtml}
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 0 0 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: ${EmailTheme.colors.text}; color: #FFFFFF; padding: 16px 48px; border-radius: 14px; font-size: 16px; font-weight: 600; text-decoration: none; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);">
                Accept Invitation
            </a>
        </div>

        <!-- Expiry Note -->
        <p style="font-size: 13px; color: ${EmailTheme.colors.subtext}; text-align: center; margin: 0; font-style: italic;">
            This secure link expires in 7 days.
        </p>

        <hr style="border: none; border-top: 1px solid ${EmailTheme.colors.border}; margin: 32px 0;">

        <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center; margin: 0;">
            If you were not expecting this invitation, you can safely ignore this email.<br>
            <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Privacy Policy</a> • <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.subtext}; text-decoration: underline;">Support</a>
        </p>

        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid ${EmailTheme.colors.border}; padding-top: 24px;">
            <p style="font-size: 12px; color: ${EmailTheme.colors.subtext}; text-align: center; margin: 0;">
                Powered by <a href="https://app.xcreate.io" style="color: ${EmailTheme.colors.brand};">Ads x Create</a>
            </p>
        </div>

    </div>
</body>
</html>`;
}
