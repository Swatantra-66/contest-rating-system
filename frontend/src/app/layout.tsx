import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "ELONODE",
  description:
    "A coding duel contest platform with a rating system based on a transparent percentile model. Following each contest, it calculates beaten participants to determine a percentile category, assigns a predefined standard performance rating, and updates the user rating using a controlled adjustment formula",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#10b981",
          colorBackground: "#09090b",
          colorText: "#ffffff",
          colorTextOnPrimaryBackground: "#000000",
          colorTextSecondary: "#a1a1aa",
          colorInputText: "#ffffff",
          fontFamily: "var(--font-geist-sans)",
        },
        elements: {
          logoBox: {
            display: "none",
          },

          card: {
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            boxShadow: "0 0 30px rgba(16,185,129,0.05)",
          },

          // Modal Close Button (Cross icon) make it visible
          modalCloseButton: {
            color: "#ffffff",
            "&:hover": {
              color: "#10b981",
            },
          },

          navbar: {
            backgroundColor: "#09090b",
            borderRight: "1px solid #27272a",
          },
          navbarButton: {
            color: "#a1a1aa",
            "&:hover": {
              backgroundColor: "#27272a", // Gray background on hover
              color: "#ffffff",
            },
          },
          pageScrollBox: {
            backgroundColor: "#18181b",
          },
          profileSection: {
            borderBottom: "1px solid #27272a",
          },

          profileSectionTitle: {
            color: "#ffffff",
            fontFamily: "var(--font-orbitron)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
          profileSectionTitleText: {
            color: "#ffffff",
          },
          profileSectionPrimaryButton: {
            color: "#10b981",
          },
          userPreviewTextContainer: {
            color: "#ffffff",
          },
          // Main user identifier (Username "AR1SEE") made green
          userPreviewMainIdentifier: {
            color: "#10b981",
            fontWeight: "600",
          },
          userPreviewSecondaryIdentifier: {
            color: "#a1a1aa",
          },
          badge: {
            backgroundColor: "#27272a",
            color: "#ffffff",
            border: "1px solid #3f3f46",
          },
          profileSectionContent: {
            color: "#d4d4d8",
          },
          accordionTriggerButton: {
            color: "#ffffff",
          },
          activeDeviceIcon: {
            color: "#10b981",
          },

          userButtonPopoverCard: {
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          },
          userButtonPopoverActionButton: {
            color: "#d4d4d8",
            "&:hover": {
              backgroundColor: "#27272a",
              color: "#10b981",
            },
          },
          userButtonPopoverActionButtonText: {
            color: "#ffffff",
          },

          headerTitle: {
            color: "#ffffff",
            fontFamily: "var(--font-orbitron)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
          headerSubtitle: {
            color: "#a1a1aa",
          },
          identityPreviewText: {
            color: "#ffffff",
            fontWeight: "500",
          },

          socialButtonsBlockButton: {
            backgroundColor: "#09090b",
            border: "1px solid #3f3f46",
            "&:hover": {
              backgroundColor: "#27272a",
              borderColor: "#10b981",
            },
          },
          socialButtonsBlockButtonText: {
            color: "#ffffff",
            fontWeight: "600",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          socialButtonsProviderIcon: {
            filter: "brightness(0) invert(1)",
          },
          "socialButtonsProviderIcon--github": {
            filter: "brightness(0) invert(1) contrast(1.2)",
            opacity: "1",
          },

          formFieldInput: {
            backgroundColor: "#09090b",
            borderColor: "#3f3f46",
            color: "#ffffff",
            fontFamily: "var(--font-geist-mono)",
            "&:focus": {
              borderColor: "#10b981",
            },
          },
          otpCodeFieldInput: {
            backgroundColor: "#09090b",
            borderColor: "#3f3f46",
            color: "#10b981",
            fontWeight: "700",
            fontFamily: "var(--font-geist-mono)",
            "&:focus": {
              borderColor: "#10b981",
            },
          },
          formFieldInput__verificationCode: {
            backgroundColor: "#09090b",
            borderColor: "#3f3f46",
            color: "#10b981",
            fontWeight: "700",
            fontFamily: "var(--font-geist-mono)",
          },

          formFieldLabel: {
            color: "#d4d4d8",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "11px",
          },
          formFieldHintText: {
            color: "#71717a",
          },
          formFieldInfoText: {
            color: "#71717a",
          },
          formFieldErrorText: {
            color: "#ef4444",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "11px",
          },
          formFieldSuccessText: {
            color: "#10b981",
            fontWeight: "500",
          },

          dividerLine: {
            backgroundColor: "#3f3f46",
          },
          dividerText: {
            color: "#71717a",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
          footerActionText: {
            color: "#a1a1aa",
          },
          footerActionLink: {
            color: "#10b981",
            fontWeight: "600",
            "&:hover": {
              color: "#34d399",
            },
          },

          formButtonPrimary: {
            backgroundColor: "#10b981",
            color: "#000000",
            fontWeight: "800",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            boxShadow: "0 4px 0 rgba(4,120,87,1)",
            "&:hover": {
              backgroundColor: "#34d399",
              transform: "translateY(2px)",
              boxShadow: "0 2px 0 rgba(4,120,87,1)",
            },
            "&:active": {
              transform: "translateY(4px)",
              boxShadow: "none",
            },
          },
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased flex min-h-screen text-zinc-50 overflow-hidden`}
        >
          <WebSocketProvider>
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen relative">
              {children}
            </main>
          </WebSocketProvider>

          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
