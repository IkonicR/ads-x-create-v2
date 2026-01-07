import { Button, Heading, Text, Section } from '@react-email/components';
import React from 'react';
import { Layout } from './components/Layout';
import { EmailTheme } from './theme';

interface ShareAssetEmailProps {
    businessName: string;
    shareUrl: string;
    expiresAt?: string;
}

export const ShareAssetEmail: React.FC<ShareAssetEmailProps> = ({
    businessName = 'a business',
    shareUrl = 'https://app.xcreate.io',
    expiresAt,
}) => {
    return (
        <Layout previewText={`Print-Ready Asset from ${businessName}`}>
            <Heading style={{
                fontSize: '24px',
                fontWeight: '700',
                color: EmailTheme.colors.text,
                margin: '0 0 16px 0',
                textAlign: 'center'
            }}>
                Print-Ready Asset 🎨
            </Heading>

            <Text style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: EmailTheme.colors.text,
                margin: '0 0 24px 0',
                textAlign: 'center'
            }}>
                <strong style={{ color: EmailTheme.colors.brand }}>{businessName}</strong> has shared a print-ready asset with you.
                Click below to access and download in your preferred format.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                <Button
                    href={shareUrl}
                    style={{
                        background: EmailTheme.colors.brandGradient,
                        color: EmailTheme.colors.surface,
                        padding: '14px 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 4px 6px rgba(109, 93, 252, 0.25)',
                    }}
                >
                    Download Asset
                </Button>
            </Section>

            <Text style={{
                fontSize: '14px',
                color: EmailTheme.colors.subtext,
                textAlign: 'center',
                margin: '0'
            }}>
                {expiresAt
                    ? `This link expires on ${new Date(expiresAt).toLocaleDateString()}.`
                    : 'This link does not expire.'}
            </Text>
        </Layout>
    );
};

export default ShareAssetEmail;
