import './globals.css';

export const metadata = {
  title: 'Sanctuary Planner',
  description: 'Church sanctuary floor plan and seating layout tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}