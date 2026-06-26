import { Injectable, Logger } from '@nestjs/common';
import { EnvConfig } from '../../core/config/env.config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private brevoApiKey: string | null = null;
  private fromEmail = 'onboarding@resend.dev';

  constructor(envConfig: EnvConfig) {
    const brevoConfig = envConfig.brevoConfig;
    this.brevoApiKey = brevoConfig.apiKey || null;
    this.fromEmail = brevoConfig.emailFrom || 'onboarding@resend.dev';
    
    if (this.brevoApiKey && this.brevoApiKey !== 'change-me' && this.brevoApiKey !== 'your-brevo-api-key') {
      this.logger.log('Brevo Email Client configured successfully.');
    } else {
      this.logger.warn(
        'BREVO_API_KEY not configured. E-mails will be logged to console instead of sent.',
      );
    }
  }

  async sendInvitationEmail(to: string, workspaceName: string, inviteLink: string) {
    const subject = `You are invited to join ${workspaceName} on Krumos`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F2EFE9; padding: 30px; border-radius: 8px; color: #1B1713; max-width: 600px; margin: 0 auto; border: 1px solid rgba(27,23,19,0.14);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #F44E14; text-transform: uppercase; font-size: 24px; letter-spacing: -0.012em; font-weight: 900; margin: 0;">KRUMOS</h2>
          <span style="font-family: monospace; font-size: 11px; letter-spacing: 0.22em; color: #8B847A;">PROJECT MANAGEMENT TOOL</span>
        </div>
        
        <p style="font-size: 16px; line-height: 1.55; color: #372D2B;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.55; color: #372D2B;">
          You have been invited to join the workspace <strong>${workspaceName}</strong> as a team member.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #1B1713; color: #F2EFE9; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #4F4948; line-height: 1.55;">
          This link will expire in 72 hours. If you did not expect this invitation, you can safely ignore this email.
        </p>
        
        <hr style="border: 0; border-top: 1px solid rgba(27,23,19,0.14); margin: 30px 0;" />
        
        <div style="font-size: 11px; color: #8B847A; font-family: monospace; text-align: center; line-height: 1.5;">
          Krumos Tech LLP &copy; 2026<br/>
          Internal Document &mdash; Do not distribute.
        </div>
      </div>
    `;

    if (this.brevoApiKey && this.brevoApiKey !== 'change-me' && this.brevoApiKey !== 'your-brevo-api-key') {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': this.brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: 'Krumos',
              email: this.fromEmail,
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `Failed to send email via Brevo to ${to}: [Status ${response.status}] ${errorText}`,
          );
        } else {
          this.logger.log(`Invitation email sent to ${to} using Brevo`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to send email via Brevo to ${to}`, err.stack);
      }
    } else {
      this.logger.log(`
==================================================
MOCK EMAIL INVITATION LOG (Brevo - Not Configured)
To: ${to}
Subject: ${subject}
Invitation Link: ${inviteLink}
==================================================
      `);
    }
  }
}
