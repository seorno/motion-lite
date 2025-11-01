import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";

export const metadata = { title: "Motion Lite", description: "Personal auto-scheduling (no LLM)" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{display:'flex',justifyContent:'space-between',padding:'12px',borderBottom:'1px solid #e5e5e5'}}>
          <div><Link href="/">Motion Lite</Link></div>
          <nav style={{display:'flex',gap:'12px'}}>
            <a href="/api/auth/signin">Sign in</a>
            <a href="/api/auth/signout">Sign out</a>
          </nav>
        </header>
        <main style={{maxWidth:900, margin:'20px auto', padding:'0 16px'}}>{children}</main>
      </body>
    </html>
  );
}
