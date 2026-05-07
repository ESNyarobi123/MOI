import type { ReactNode } from "react";

export function AdminEmptyState({
  title,
  description,
  icon
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      {icon ? <div className="admin-empty-icon">{icon}</div> : null}
      <h3 className="admin-empty-title">{title}</h3>
      {description ? <p className="admin-empty-desc">{description}</p> : null}
    </div>
  );
}
