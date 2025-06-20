import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PDF Techno - PDF Processing Tools',
  description: 'Process, convert, and manage your PDF documents with ease',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
          {children}
      </body>
    </html>
  );
}