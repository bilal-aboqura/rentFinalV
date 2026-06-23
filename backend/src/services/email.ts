import nodemailer, { type SendMailOptions, type SentMessageInfo } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../middleware/logger';

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface MailTransporter {
  sendMail: (opts: SendMailOptions) => Promise<SentMessageInfo>;
}

export type TestTransporter = MailTransporter;

let transporter: MailTransporter | null = null;

function getTransporter(): MailTransporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
}

export async function sendMail(options: MailOptions): Promise<SentMessageInfo> {
  const transporterInstance = getTransporter();
  const payload: SendMailOptions = {
    from: env.smtp.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  try {
    return await transporterInstance.sendMail(payload);
  } catch (err) {
    logger.error('Failed to send email:', err);
    throw err;
  }
}

export function setTransporterForTesting(testTransporter: TestTransporter): void {
  transporter = testTransporter;
}

export function resetTransporter(): void {
  transporter = null;
}

export default { sendMail };
