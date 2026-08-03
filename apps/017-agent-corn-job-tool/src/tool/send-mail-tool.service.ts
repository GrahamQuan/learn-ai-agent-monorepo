import { tool } from '@langchain/core/tools';
import type { Transporter } from 'nodemailer';
import { z } from 'zod';
import type { ENV } from '../env';

export class SendMailToolService {
  readonly tool;

  constructor(
    private readonly mailerService: Transporter,
    private readonly configService: ENV,
  ) {
    const sendMailArgsSchema = z.object({
      to: z.email().describe('收件人邮箱地址，例如：someone@example.com'),
      subject: z.string().describe('邮件主题'),
      text: z.string().optional().describe('纯文本内容，可选'),
      html: z.string().optional().describe('HTML 内容，可选'),
    });

    this.tool = tool(
      async ({ to, subject, text, html }) => {
        await this.mailerService.sendMail({
          to,
          subject,
          text: text ?? '（无文本内容）',
          html: html ?? `<p>${text ?? '（无 HTML 内容）'}</p>`,
          from: this.configService.MAIL_FROM,
        });
        return `邮件已发送到 ${to}，主题为「${subject}」`;
      },
      {
        name: 'send_mail',
        description: '发送电子邮件。需要提供收件人邮箱、主题，可选文本内容和 HTML 内容。',
        schema: sendMailArgsSchema,
      },
    );
  }
}
