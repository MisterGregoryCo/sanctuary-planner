import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanctuary Planner",
  description: "Church sanctuary floor plan tool with chair layouts and seat counts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#060910] text-[#c8d1dc]">
        {children}
      </body>
    </html>
  );
}
