import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyPlan",
  description: "Turn what's due into what to do today.",
};

// Sets the theme before paint to avoid a flash (reads saved choice, else OS pref).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
