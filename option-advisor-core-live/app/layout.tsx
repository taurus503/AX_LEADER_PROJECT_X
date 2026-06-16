import type { Metadata } from "next";
import { ADVISOR_BASE_PATH } from "@/lib/paths";
import "./globals.css";

export const metadata: Metadata = {
  title: "Option Playbook Advisor Core",
  description: "Codex 1 Option Advisor Core dashboard for KOSPI200 regime-aware option selection.",
  icons: {
    icon: `${ADVISOR_BASE_PATH}/favicon.svg`,
    shortcut: `${ADVISOR_BASE_PATH}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
