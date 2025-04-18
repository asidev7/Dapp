import './globals.css';

export const metadata = {
  title: 'DApp TRC20',
  description: 'Application décentralisée pour interagir avec un smart contract TRC20',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}