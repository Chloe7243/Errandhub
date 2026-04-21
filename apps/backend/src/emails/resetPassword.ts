import { baseTemplate } from "./base";

export const resetPasswordEmail = (resetToken: string) =>
  baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a202c;font-size:22px;">Reset your password</h2>
    <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.6;">
     To reset your ErrandHub password, tap the button below.
    </p>
 
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:8px;background-color:#1A6DC0;">
          <a
            href="${process.env.APP_URL}/--/reset-password?token=${resetToken}"
            style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;"
          >
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#9aa5b4;font-size:12px;">Button not working? Click on this link:</p>
    <p style="margin:0;color:#1A6DC0;font-size:12px;word-break:break-all;">${process.env.APP_URL}/--/reset-password?token=${resetToken}</p>
    <p style="margin:12px 0 12px;color:#4a5568;font-size:12px;line-height:1.6;"> This link expires in <strong>10 minutes</strong>. </p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e8edf2;" />
    <p style="margin:0;color:#9aa5b4;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `);
