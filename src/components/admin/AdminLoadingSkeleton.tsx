export function AdminStatSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="admin-stat-grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-stat admin-skeleton">
          <div className="admin-skeleton-line admin-skeleton-line--short" />
          <div className="admin-skeleton-line admin-skeleton-line--lg" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="admin-table-wrap admin-skeleton-wrap" aria-hidden>
      <table className="admin-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="admin-skeleton-line admin-skeleton-line--short" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div className="admin-skeleton-line" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPageLoading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="admin-loading-inline">
      <span className="admin-loading-dot" />
      <span>{label}</span>
    </div>
  );
}
