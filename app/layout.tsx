import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show Portal | Advance Apparels',
  description: 'Manage trade show orders and customer portals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts for Art Deco Theme */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
