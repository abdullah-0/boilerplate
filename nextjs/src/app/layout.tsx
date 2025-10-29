import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Next Auth Starter",
  description: "Next.js starter with JWT authentication hooks",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
