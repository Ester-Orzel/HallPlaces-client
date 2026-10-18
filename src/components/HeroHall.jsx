// The picture at the top of the events page: a tiny curved hall, with one seat that "drops in" as reserved.
// Pure decoration (aria-hidden), built from the same seat shape as the real seat map.
const ROWS = [7, 9, 11];
const ROW_COLORS = ['var(--front)', 'var(--middle)', 'var(--back)'];

export default function HeroHall() {
  return (
    <div className="hero-hall" aria-hidden="true">
      <div className="hero-stage" />
      {ROWS.map((count, row) => (
        <div key={row} className="hero-row">
          {Array.from({ length: count }, (_, i) => {
            const fromCenter = (i - (count - 1) / 2) / ((count - 1) / 2);   // -1 .. 1
            const reserved = row === 1 && i === 4;
            return (
              <i
                key={i}
                className={reserved ? 'reserved' : ''}
                style={{
                  background: reserved ? undefined : ROW_COLORS[row],
                  transform: `translateY(${-fromCenter * fromCenter * 14}px) rotate(${fromCenter * 14}deg)`
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
