export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="state-block">
      {Icon && (
        <span className="state-block__icon">
          <Icon aria-hidden="true" />
        </span>
      )}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
