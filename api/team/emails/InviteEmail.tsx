import { Button, Heading, Text, Section, Container, Hr, Link } from '@react-email/components';
import React from 'react';
import { Layout } from './components/Layout';
import { EmailTheme } from './theme';

interface InviteEmailProps {
    businessName: string; // Can be a comma-separated list
    role: string;
    inviteLink: string;
}

export const InviteEmail: React.FC<InviteEmailProps> = ({
    businessName = 'Ads x Create',
    role = 'member',
    inviteLink = 'https://app.xcreate.io',
}) => {
    // Parse business names if comma-separated
    const businesses = businessName.split(',').map(s => s.trim()).filter(Boolean);
    const isMulti = businesses.length > 1;

    return (
        <Layout previewText={isMulti ? `You've been invited to join ${businesses.length} workspaces` : `You've been invited to join ${businesses[0]}`}>

            {/* Header / Status */}
            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#F3F4F6', // Light gray badge
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: EmailTheme.colors.brand,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Official Invitation
                </div>
            </Section>

            {/* Main Heading */}
            <Heading style={{
                fontSize: '32px',
                fontWeight: '800',
                color: EmailTheme.colors.text,
                margin: '0 0 16px 0',
                textAlign: 'center',
                letterSpacing: '-1px',
                lineHeight: '1.2'
            }}>
                Welcome to the <br />
                <span style={{ color: EmailTheme.colors.brand }}>Command Center</span>
            </Heading>

            <Text style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: EmailTheme.colors.subtext,
                margin: '0 0 32px 0',
                textAlign: 'center',
                maxWidth: '480px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                You have been granted <strong>{role}</strong> access to the following workspace{isMulti ? 's' : ''}.
                Connect now to start collaborating.
            </Text>

            {/* Business List Card */}
            <Container style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #E5E7EB',
                marginBottom: '32px',
                width: '100%'
            }}>
                {businesses.map((biz, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: index !== businesses.length - 1 ? '1px solid #E5E7EB' : 'none'
                    }}>
                        {/* Fake Icon */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: EmailTheme.colors.brand,
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '16px'
                            }}>
                                {biz.charAt(0).toUpperCase()}
                            </div>
                            <Text style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '600',
                                color: EmailTheme.colors.text
                            }}>
                                {biz}
                            </Text>
                        </div>
                        <Text style={{
                            margin: 0,
                            fontSize: '12px',
                            color: EmailTheme.colors.subtext,
                            backgroundColor: '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB'
                        }}>
                            Active
                        </Text>
                    </div>
                ))}
            </Container>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', margin: '0 0 32px 0' }}>
                <Button
                    href={inviteLink}
                    style={{
                        background: EmailTheme.colors.text, // Dark button for premium feel
                        color: '#FFFFFF',
                        padding: '16px 48px',
                        borderRadius: '14px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.3)',
                        transition: 'transform 0.2s',
                    }}
                >
                    Accept Invitation
                </Button>
            </Section>

            {/* Expiry Note */}
            <Text style={{
                fontSize: '13px',
                color: EmailTheme.colors.subtext,
                textAlign: 'center',
                margin: '0',
                fontStyle: 'italic'
            }}>
                This secure link expires in 7 days.
            </Text>

            <Hr style={{ borderColor: '#E5E7EB', margin: '32px 0' }} />

            <Text style={{
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#9CA3AF',
                textAlign: 'center',
                margin: 0
            }}>
                If you were not expecting this invitation, you can safely ignore this email.<br />
                <Link href="https://app.xcreate.io" style={{ color: EmailTheme.colors.subtext, textDecoration: 'underline' }}>Privacy Policy</Link> • <Link href="https://app.xcreate.io" style={{ color: EmailTheme.colors.subtext, textDecoration: 'underline' }}>Support</Link>
            </Text>

        </Layout>
    );
};

export default InviteEmail;
