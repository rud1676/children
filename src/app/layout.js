import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '길가에교회 청소년부 수련회 칭찬릴레이',
  description: '청소년부 수련회 칭찬릴레이 게임',
};

export default function RootLayout({ children }) {
  return (
    <html lang='ko'>
      <body className={inter.className}>
        {children}
        <Toaster
          position='top-right'
          toastOptions={{
            className: 'toast-nature',
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
              color: 'white',
              border: '2px solid #2E7D32',
              fontFamily: 'Press Start 2P, cursive',
              fontSize: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
