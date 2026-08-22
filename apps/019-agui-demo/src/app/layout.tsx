import type { Metadata } from 'next';
import 'streamdown/styles.css';
import '../App.css';
import '../components/StreamdownText.css';
import '../components/ToolPanels.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'agui',
  description: 'AI SDK + LangChain agent UI powered by Next.js and Hono',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='zh-CN'>
      <body>
        <div id='root'>{children}</div>
      </body>
    </html>
  );
}
