// A ticket with a tear-off stub that shows the date.
// Used by the events list AND by "my bookings", so the look is written once.
export default function Ticket({ startsAt, title, color, children, action, onClick, faded = false }) {
  const date = new Date(startsAt);   // UTC from the server -> local time for display

  return (
    <article
      className={`ticket ${onClick ? 'clickable' : ''} ${faded ? 'faded' : ''}`}
      style={{ '--accent': color }}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="stub">
        <span className="month">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="day">{date.getDate()}</span>
        <span className="weekday">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      </div>
      <div className="body">
        <h2>{title}</h2>
        {children}
      </div>
      {action && <div className="action">{action}</div>}
    </article>
  );
}
