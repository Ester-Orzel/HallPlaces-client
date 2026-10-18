import { useCallback, useEffect, useState } from 'react';
import { api, formatDate, formatTime, formatPrice } from '../api';
import { colorFor } from '../colors';

// Price sections. The SERVER decides the price of every row (EventService.PriceForRow);
// the client only gives each distinct price a name and a color, from the most expensive to the cheapest.
const SECTIONS = [
  { name: 'Front', color: 'var(--front)' },
  { name: 'Middle', color: 'var(--middle)' },
  { name: 'Back', color: 'var(--back)' }
];

// Screen 3: the seat map + "Book" - the action on the limited resource.
// Screen 4 is inside it: the clear message when the server answers 409 (the seat was taken).
export default function EventPage({ eventId, user, onBack, onLoginNeeded }) {
  const [ev, setEv] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);   // { type: 'success' | 'conflict' | 'error', text }
  const [busy, setBusy] = useState(false);

  // useCallback: the same function object between renders, so it can be a dependency of useEffect.
  const loadSeats = useCallback(
    () => api(`/api/events/${eventId}/seats`).then(setSeats),
    [eventId]
  );

  useEffect(() => {
    api(`/api/events/${eventId}`).then(setEv).catch((err) => setMessage({ type: 'error', text: err.message }));
    loadSeats().catch((err) => setMessage({ type: 'error', text: err.message }));
  }, [eventId, loadSeats]);

  async function book() {
    if (!user) {
      onLoginNeeded();
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const booking = await api('/api/bookings', { method: 'POST', body: { seatId: selected.id } });
      setMessage({ type: 'success', text: `Booked! Row ${booking.rowNumber}, seat ${booking.seatNumber} is yours.` });
    } catch (err) {
      if (err.status === 409) {
        // THE important case: someone else got this seat first. The server's own text is shown as well.
        setMessage({ type: 'conflict', text: err.message });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      // Success or failure - the map we hold may be out of date, so we reload it from the server.
      setSelected(null);
      await loadSeats().catch(() => {});
      setBusy(false);
    }
  }

  // Distinct prices, most expensive first: [90, 75, 60] -> Front, Middle, Back.
  const prices = [...new Set(seats.map((s) => s.price))].sort((a, b) => b - a);
  const sectionOf = (price) => SECTIONS[Math.min(prices.indexOf(price), SECTIONS.length - 1)];

  // [{seat...}, ...] -> { 1: [seats of row 1], 2: [...] }
  const rows = {};
  for (const seat of seats) {
    (rows[seat.rowNumber] ??= []).push(seat);
  }

  const accent = ev ? colorFor(ev.categories[0]?.id ?? ev.id) : 'var(--ink)';

  return (
    <section>
      <button className="link back" onClick={onBack}>Back to all events</button>

      {ev && (
        <header className="event-head" style={{ '--accent': accent }}>
          <p className="tags">{ev.categories.map((c) => <span key={c.id}>{c.name}</span>)}</p>
          <h1>{ev.title}</h1>
          <p className="when">{formatDate(ev.startsAt)} at {formatTime(ev.startsAt)}</p>
          <p className="where">{ev.hallName}</p>
          {ev.description && <p className="desc">{ev.description}</p>}
        </header>
      )}

      {message?.type === 'conflict' && (
        <div className="alert conflict" role="alert">
          <strong>That seat was just taken.</strong>
          Someone else booked it a moment before you. The map below is up to date, so please pick another seat.
          <div className="server-text">Server: {message.text}</div>
        </div>
      )}
      {message?.type === 'success' && <p className="alert success" role="status">{message.text}</p>}
      {message?.type === 'error' && <p className="alert error" role="alert">{message.text}</p>}

      <div className="hall">
        <div className="stage">Stage</div>

        <div className="seatmap">
          {Object.keys(rows).map((rowNumber) => {
            const row = rows[rowNumber];
            const mid = (row.length - 1) / 2 || 1;
            return (
              <div key={rowNumber} className="row">
                <span className="row-label">{rowNumber}</span>
                {row.map((seat, i) => {
                  // The rows curve toward the stage: the further from the center, the higher and more turned.
                  const fromCenter = (i - (row.length - 1) / 2) / mid;
                  const section = sectionOf(seat.price);
                  return (
                    <button
                      key={seat.id}
                      className={`seat ${seat.status === 'Booked' ? 'booked' : ''} ${selected?.id === seat.id ? 'selected' : ''}`}
                      style={{
                        '--seat': section.color,
                        '--lift': `${-fromCenter * fromCenter * 16}px`,
                        '--turn': `${fromCenter * 10}deg`
                      }}
                      disabled={seat.status === 'Booked'}
                      aria-label={`Row ${seat.rowNumber}, seat ${seat.seatNumber}, ${section.name}, ${formatPrice(seat.price)}`}
                      title={`Row ${seat.rowNumber}, seat ${seat.seatNumber}: ${formatPrice(seat.price)}`}
                      onClick={() => { setSelected(seat); setMessage(null); }}
                    >
                      {seat.seatNumber}
                    </button>
                  );
                })}
                <span className="row-label">{rowNumber}</span>
              </div>
            );
          })}
        </div>

        <div className="legend">
          {prices.slice(0, SECTIONS.length).map((price) => (
            <span key={price}><i className="dot" style={{ background: sectionOf(price).color }} />{sectionOf(price).name} {formatPrice(price)}</span>
          ))}
          <span><i className="dot gold" />Your pick</span>
          <span><i className="dot taken" />Taken</span>
        </div>
      </div>

      {selected && (
        <div className="booking-bar">
          <div>
            <span className="pick-section">{sectionOf(selected.price).name} section</span>
            <span className="pick-seat">Row {selected.rowNumber}, seat {selected.seatNumber}</span>
          </div>
          <strong className="pick-price">{formatPrice(selected.price)}</strong>
          <button className="primary" onClick={book} disabled={busy}>
            {user ? (busy ? 'Booking...' : 'Book this seat') : 'Log in to book'}
          </button>
        </div>
      )}
    </section>
  );
}
