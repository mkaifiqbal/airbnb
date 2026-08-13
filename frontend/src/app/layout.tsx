import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Airbnb Clone | Find Your Perfect Stay",
  description: "Browse unique homes, experiences, and places around the world. Book your next adventure with our Airbnb-inspired platform.",
  keywords: "airbnb, vacation rental, holiday homes, accommodation, travel, booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
