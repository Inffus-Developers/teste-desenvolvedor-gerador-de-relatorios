import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inffus Faturamento',
  description: 'Sistema de gestão de faturamento otimizado e seguro.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
