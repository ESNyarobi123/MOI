import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MoiDate | Premium Connection Platform",
  description:
    "MoiDate is a safe romantic connection platform for adults. Discover real people, match, chat, and unlock verified premium experiences.",
  icons: {
    icon: [
      { url: "/moidate.png", type: "image/png" },
    ],
    apple: "/moidate.png",
    shortcut: "/moidate.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,600;0,700;0,900;1,600&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
