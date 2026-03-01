import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LocaleProvider from '@/components/LocaleProvider';
import './globals.css';

export const metadata: Metadata = {
  title: '社区违规记录',
  description: '社区违规发言记录工具'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='zh-CN'>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

