import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  meta,
  actions
}: {
  title: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header-text">
        <p className="admin-eyebrow">MoiDate console</p>
        <h1 className="admin-title">{title}</h1>
        {description ? <p className="admin-sub">{description}</p> : null}
        {meta ? <p className="admin-meta">{meta}</p> : null}
      </div>
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </header>
  );
}
