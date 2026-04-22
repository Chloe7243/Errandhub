import { baseTemplate } from "./base";

export const welcomeEmail = (firstName: string) =>
  baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a202c;font-size:22px;">Welcome, ${firstName}! 🎉</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      We're excited to have you on board. ErrandHub connects you with trusted people to get things done.
    </p>
    <p style="margin:0;color:#9aa5b4;font-size:13px;line-height:1.6;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `);
