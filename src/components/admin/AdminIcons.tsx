/** Inline SVGs — no extra deps. Stroke icons for sidebar + stats. */

import type { SVGProps } from "react";

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export function IconLayoutDashboard(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>;
}

export function IconChart(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M3 3v18h18" /><path d="m7 14 4-4 4 4 7-9" /></svg>;
}

export function IconHeartHandshake(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M12 21s-4-3.5-6-6.5S3.5 9 6 7s3 1 6 4 3-2 6-4 4.5 2.5 0 7.5-6 6.5-6 6.5z" /></svg>;
}

export function IconUsers(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

export function IconBadgeCheck(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>;
}

export function IconFlag(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>;
}

export function IconSparkles(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" /></svg>;
}

export function IconWallet(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>;
}

export function IconMegaphone(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
}

export function IconLogOut(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;
}

export function IconLoader(p: SVGProps<SVGSVGElement>) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="admin-icon-spin" {...p}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>;
}

export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}

export function IconPlus(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
}

export function IconEdit(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

export function IconTrash(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}

export function IconX(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

export function IconCheck(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>;
}

export function IconEye(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}

export function IconDownload(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
}

export function IconTrendingUp(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}

export function IconTrendingDown(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>;
}

export function IconCreditCard(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" x2="23" y1="10" y2="10" /></svg>;
}

export function IconFilter(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
}

export function IconRefresh(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>;
}

export function IconShield(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}

export function IconBell(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}

export function IconSettings(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}

export function IconArrowUp(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><line x1="12" x2="12" y1="19" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>;
}

export function IconArrowDown(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><line x1="12" x2="12" y1="5" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>;
}

export function IconChevronLeft(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="15 18 9 12 15 6" /></svg>;
}

export function IconChevronRight(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="9 18 15 12 9 6" /></svg>;
}

export function IconActivity(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}

export function IconPackage(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
}

export function IconCalendar(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}

export function IconMail(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
}

export function IconMoreH(p: SVGProps<SVGSVGElement>) {
  return <svg {...base} {...p}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
}
