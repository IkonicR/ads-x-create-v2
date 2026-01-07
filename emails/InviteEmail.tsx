import { Button, Heading, Text, Section } from '@react-email/components';
import React from 'react';
import { Layout } from './components/Layout';
import { EmailTheme } from './theme';

interface InviteEmailProps {
    businessName: string;
    role: string;
    inviteLink: string;
}

export const InviteEmail: React.FC<InviteEmailProps> = ({
    businessName = 'a business',
    role = 'member',
    inviteLink = 'https://app.xcreate.io',
}) => {
    return (
        <Layout previewText={`You've been invited to join ${businessName}`}>
            <Heading style={{
                fontSize: '24px',
                fontWeight: '700',
                color: EmailTheme.colors.text,
                margin: '0 0 16px 0',
                textAlign: 'center'
            }}>
                You're Invited! 🎉
            </Heading>

            <Text style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: EmailTheme.colors.text,
                margin: '0 0 24px 0',
                textAlign: 'center'
            }}>
                You've been invited to join <strong style={{ color: EmailTheme.colors.brand }}>{businessName}</strong> as a <strong>{role}</strong>.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                <Button
                    href={inviteLink}
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
                    Accept Invitation
                </Button>
            </Section>

            <Text style={{
                fontSize: '14px',
                color: EmailTheme.colors.subtext,
                textAlign: 'center',
                margin: '0'
            }}>
                This invitation expires in 7 days.
            </Text>
        </Layout>
    );
};

export default InviteEmail;
