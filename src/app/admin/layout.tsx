import { Inter, Poppins } from "next/font/google";
import "./admin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-admin-inter",
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-admin-poppins",
  display: "swap"
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${poppins.variable} admin-root`}>{children}</div>
  );
}
