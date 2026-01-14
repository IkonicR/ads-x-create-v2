import { Html, Head, Preview, Body, Container, Section, Text, Link } from '@react-email/components';
import React from 'react';
import { EmailTheme } from '../theme';

interface LayoutProps {
    children: React.ReactNode;
    previewText?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, previewText }) => {
    return (
        <Html>
            <Head />
            {previewText && <Preview>{previewText}</Preview>}
            <Body style={{
                backgroundColor: EmailTheme.colors.background,
                fontFamily: EmailTheme.structure.fontFamily,
                margin: '0',
                padding: '40px 20px',
            }}>
                <Container style={{
                    backgroundColor: EmailTheme.colors.surface,
                    borderRadius: EmailTheme.structure.borderRadius,
                    padding: '40px',
                    maxWidth: EmailTheme.structure.maxWidth,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${EmailTheme.colors.border}`,
                    margin: '0 auto',
                }}>
                    {/* Logo Area */}
                    <Section style={{ marginBottom: '32px', textAlign: 'center' }}>
                        {/* We can add a logo image here later if needed */}
                        <Text style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            letterSpacing: '-0.5px',
                            margin: 0,
                            color: EmailTheme.colors.text
                        }}>
                            Ads <span style={{ color: EmailTheme.colors.brand }}>x</span> Create
                        </Text>
                    </Section>

                    {children}

                    {/* Footer */}
                    <Section style={{ marginTop: '40px', borderTop: `1px solid ${EmailTheme.colors.border}`, paddingTop: '24px' }}>
                        <Text style={{
                            fontSize: '12px',
                            color: EmailTheme.colors.subtext,
                            textAlign: 'center',
                            margin: 0
                        }}>
                            Powered by <Link href="https://app.xcreate.io" style={{ color: EmailTheme.colors.brand }}>Ads x Create</Link>
                        </Text>
                    </Section>

                </Container>
            </Body >
        </Html >
    );
};
