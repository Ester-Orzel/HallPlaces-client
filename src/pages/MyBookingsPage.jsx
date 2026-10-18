import { useEffect, useState } from 'react';
import { api, formatTime, formatPrice } from '../api';
import Ticket from '../components/Ticket';
import { colorFor } from '../colors';

// "My bookings" + cancel. The server knows who "I" am from the token, so the URL has no user id.
export default function MyBookingsPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/api/bookings/mine').then(setBookings).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!window.confirm('Cancel this booking? The seat will become free for others.')) return;
    setError('');
    try {
      await api(`/api/bookings/${id}`, { method: 'DELETE' });   // 204 No Content
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1 className="page-title">My bookings</h1>
      {error && <p className="alert error">{error}</p>}
      {!bookings && !error && <p className="empty">Loading your bookings...</p>}
      {bookings?.length === 0 && <p className="empty">No bookings yet. Pick an event to book your first seat.</p>}

      <div className="tickets grid">
        {bookings?.map((b) => (
          <Ticket key={b.id} startsAt={b.eventStartsAt} title={b.eventTitle} faded={b.status === 'Cancelled'}
                  color={colorFor(b.eventId)}
                  action={b.status === 'Active'
                    ? <button onClick={() => cancel(b.id)}>Cancel booking</button>
                    : <span className="status">Cancelled</span>}>
            <p className="place">{formatTime(b.eventStartsAt)}, row {b.rowNumber}, seat {b.seatNumber}</p>
            <p className="price">{formatPrice(b.price)}</p>
          </Ticket>
        ))}
      </div>
    </section>
  );
}
