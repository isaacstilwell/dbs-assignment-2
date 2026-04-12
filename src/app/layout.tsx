import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import DataProvider from "@/components/DataProvider";

export const metadata: Metadata = {
  title: "Task List",
  description: "Personal task manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-full">
          <DataProvider>
            <Nav />
            {children}
          </DataProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
