import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(email: string, otp: string, purpose: OtpPurpose): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from = this.config.get<string>('SMTP_FROM') || user;

    if (!host || !user || !pass || !from) {
      this.logger.warn(
        `SMTP is not configured. ${purpose} OTP for ${email}: ${otp}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const isPasswordReset = purpose === 'PASSWORD_RESET';

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: isPasswordReset
          ? 'Reset your Kinetic POS password'
          : 'Verify your Kinetic POS email',
        text: this.plainText(otp, isPasswordReset),
        html: this.html(otp, isPasswordReset),
      });
    } catch (error) {
      this.logger.error(
        `Unable to send ${purpose} OTP to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Email service is not accepting SMTP credentials. Please check SMTP_USER and SMTP_PASS, then request a new OTP.',
      );
    }
  }

  private plainText(otp: string, isPasswordReset: boolean): string {
    const action = isPasswordReset
      ? 'reset your password'
      : 'verify your email';
    return `Your Kinetic POS code is ${otp}. Use this code to ${action}. It expires soon.`;
  }

  private html(otp: string, isPasswordReset: boolean): string {
    const action = isPasswordReset
      ? 'reset your password'
      : 'verify your email';
    return `
      <div style="font-family: Arial, sans-serif; color: #161827;">
        <h2>Kinetic POS</h2>
        <p>Use this code to ${action}:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires soon. If you did not request it, you can ignore this email.</p>
      </div>
    `;
  }
}
