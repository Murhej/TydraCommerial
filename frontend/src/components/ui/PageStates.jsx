import "./page-states.css";

export function InlineNotice({ tone = "info", children, className = "" }) {
  if (!children) return null;
  return <p className={`ui-inline-notice ${tone} ${className}`.trim()}>{children}</p>;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "There is no data to display right now.",
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div className={`ui-empty-state${compact ? " compact" : ""}`}>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="ui-empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 6, columns = 3 }) {
  const safeRows = Math.max(1, rows);
  const safeCols = Math.max(1, columns);

  return (
    <div className="ui-skeleton-table" aria-hidden="true">
      {Array.from({ length: safeRows }).map((_, row) => (
        <div
          key={row}
          className="ui-skeleton-row"
          style={{ gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: safeCols }).map((__, col) => (
            <span key={col} className="ui-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
