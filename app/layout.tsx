import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Pawki',
  description: '함께 걷는 산책 커뮤니티',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: '#F0F0F0', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto',
          minHeight: '100vh',
          background: '#fff',
          position: 'relative',
          boxShadow: '0 0 40px rgba(0,0,0,0.08)'
        }}>
          {children}
        </div>
      </body>
    </html>
  )
}