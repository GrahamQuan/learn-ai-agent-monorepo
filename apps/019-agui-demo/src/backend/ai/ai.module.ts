import { type StructuredToolInterface, tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import nodemailer, { type Transporter } from 'nodemailer';
import { z } from 'zod';
import { env } from '../env';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

type WebSearchResponse = {
  code?: number;
  msg?: string;
  data?: {
    webPages?: {
      value?: Array<{
        name?: string;
        url?: string;
        summary?: string;
        siteName?: string;
        siteIcon?: string;
        dateLastCrawled?: string;
      }>;
    };
  };
};

export class AiModule {
  readonly chatModel: ChatOpenAI;
  readonly webSearchTool: StructuredToolInterface;
  readonly sendMailTool: StructuredToolInterface;
  readonly mailerService: Transporter;
  readonly aiService: AiService;
  readonly aiController: AiController;

  constructor() {
    this.chatModel = new ChatOpenAI({
      model: env.MODEL_NAME,
      apiKey: env.OPENAI_API_KEY,
      configuration: {
        baseURL: env.OPENAI_BASE_URL,
      },
    });

    const webSearchArgsSchema = z.object({
      query: z.string().min(1).describe('搜索关键词，例如：公司年报、某个事件等'),
      count: z.number().int().min(1).max(20).optional().describe('返回的搜索结果数量，默认 10 条'),
    });

    this.webSearchTool = tool(
      async ({ query, count }: { query: string; count?: number }) => {
        const url = 'https://api.bochaai.com/v1/web-search';
        const body = {
          query,
          freshness: 'noLimit',
          summary: true,
          count: count ?? 10,
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + env.BOCHA_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return '搜索 API 请求失败，状态码: ' + response.status + ', 错误信息: ' + errorText;
        }

        let json: unknown;
        try {
          json = await response.json();
        } catch (error) {
          return '搜索 API 请求失败，原因是：搜索结果解析失败 ' + (error as Error).message;
        }

        try {
          const searchResponse = json as WebSearchResponse;
          if (searchResponse.code !== 200 || !searchResponse.data) {
            return '搜索 API 请求失败，原因是: ' + (searchResponse.msg ?? '未知错误');
          }

          const webpages = searchResponse.data.webPages?.value ?? [];
          if (!webpages.length) {
            return '未找到相关结果。';
          }

          const formatted = webpages
            .map(
              (page, index) =>
                '引用: ' +
                (index + 1) +
                '\n    标题: ' +
                page.name +
                '\n    URL: ' +
                page.url +
                '\n    摘要: ' +
                page.summary +
                '\n    网站名称: ' +
                page.siteName +
                '\n    网站图标: ' +
                page.siteIcon +
                '\n    发布时间: ' +
                page.dateLastCrawled,
            )
            .join('\n\n');

          return formatted;
        } catch (error) {
          return '搜索 API 请求失败，原因是：搜索结果解析失败 ' + (error as Error).message;
        }
      },
      {
        name: 'web_search',
        description:
          '使用 Bocha Web Search API 搜索互联网网页。输入为搜索关键词（可选 count 指定结果数量），返回包含标题、URL、摘要、网站名称、图标和时间等信息的结果列表。',
        schema: webSearchArgsSchema,
      },
    );

    this.mailerService = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
      },
    });

    const sendMailArgsSchema = z.object({
      to: z.email().describe('收件人邮箱地址，例如：someone@example.com'),
      subject: z.string().describe('邮件主题'),
      text: z.string().optional().describe('纯文本内容，可选'),
      html: z.string().optional().describe('HTML 内容，可选'),
    });

    this.sendMailTool = tool(
      async ({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) => {
        await this.mailerService.sendMail({
          to,
          subject,
          text: text ?? '（无文本内容）',
          html: html ?? '<p>' + (text ?? '（无 HTML 内容）') + '</p>',
          from: env.MAIL_FROM,
        });

        return '邮件已发送到 ' + to + '，主题为「' + subject + '」';
      },
      {
        name: 'send_mail',
        description: '发送电子邮件。需要提供收件人邮箱、主题，可选文本内容和 HTML 内容。',
        schema: sendMailArgsSchema,
      },
    );

    this.aiService = new AiService(this.webSearchTool, this.sendMailTool, this.chatModel);
    this.aiController = new AiController(this.aiService);
  }
}
