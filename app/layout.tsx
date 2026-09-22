import { Prompt } from 'next/font/google';
import './globals.css';
import { DataProvider } from '../context/DataContext'; // <-- 1. นำเข้า Provider

const prompt = Prompt({ 
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
});

export const metadata = {
  title: 'FarmMed - ระบบบริหารจัดการในฟาร์ม',
  description: 'ระบบเบิกจ่ายยาและจัดการสต๊อกยา',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="th">
      <body className={`${prompt.className} antialiased`}>
        {/* 2. คลุม children ด้วย DataProvider */}
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}