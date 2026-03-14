import "./page-header.css";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <section className="ui-page-header surface-card">
      <div className="ui-page-header-copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-page-header-actions">{actions}</div> : null}
    </section>
  );
}
