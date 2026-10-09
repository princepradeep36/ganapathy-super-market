// Minimal typing for the part of nodemailer we use (avoids an extra @types package).
declare module 'nodemailer' {
  type Mail = { from: string; to: string; subject: string; html: string; text: string; replyTo?: string };
  type Transport = { sendMail(m: Mail): Promise<{ messageId: string }>; verify(): Promise<true> };
  const nodemailer: { createTransport(opts: Record<string, unknown>): Transport };
  export default nodemailer;
}
