import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Violation Tracker',
  description: '社区违规发言记录工具'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='zh-CN'>
      <body>{children}</body>
    </html>
  );
}
