import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'English Speaking Practice Manager',
  description:
    'Personal web application for organizing, managing, and tracking ChatGPT conversations for English speaking practice.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="darkreader-lock" content="darkreader-lock" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('pageshow', function(event) {
                if (event.persisted) {
                  window.location.reload();
                }
              });
              window.addEventListener('unhandledrejection', function(event) {
                if (!event.reason) return;
                var msg = event.reason.message || String(event.reason);
                if (msg.indexOf("Cannot read properties of undefined (reading 'send')") !== -1 ||
                    msg.indexOf("send was called before connect") !== -1 ||
                    msg.indexOf("transport was disconnected") !== -1) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });
            `,
          }}
        />
      </head>
      <body className="bg-[#212121] text-[#ececec] antialiased" suppressHydrationWarning>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
