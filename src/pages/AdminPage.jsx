import { useCallback, useEffect, useState } from 'react';
import { api, formatDate, formatTime } from '../api';

// ---------- small helpers shared by the three sections (so nothing is written twice) ----------

// Loads a list from the server. Works for plain lists and for paged results ({ items: [...] }).
function useList(path) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api(path).then((data) => setItems(data.items ?? data)).catch((err) => setError(err.message));
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { items, error, reload: load };
}

// Runs one server action and keeps its state: busy / error / success message.
// Returns true when the action succeeded, so the caller can clear its form and reload its list.
function useAction() {
  const [state, setState] = useState({ busy: false, error: '', success: '' });

  async function run(action, successText) {
    setState({ busy: true, error: '', success: '' });
    try {
      await action();
      setState({ busy: false, error: '', success: successText });
      return true;
    } catch (err) {
      setState({ busy: false, error: err.message, success: '' });
      return false;
    }
  }
  return [state, run];
}

function Notice({ state, listError }) {
  const error = state.error || listError;
  return (
    <>
      {error && <p className="alert error">{error}</p>}
      {state.success && <p className="alert success">{state.success}</p>}
    </>
  );
}

// A list of rows, each with a Delete button.
function AdminList({ items, empty, render, onDelete, busy }) {
  if (items.length === 0) return <p className="empty">{empty}</p>;
  return (
    <ul className="admin-list">
      {items.map((item) => (
        <li key={item.id}>
          <div>{render(item)}</div>
          {onDelete && <button disabled={busy} onClick={() => onDelete(item)}>Delete</button>}
        </li>
      ))}
    </ul>
  );
}

// ---------- the admin screen ----------

// Only an Admin sees this screen. The server enforces it too (403 for everybody else).
export default function AdminPage() {
  const [tab, setTab] = useState('events');
  const tabs = [['events', 'Events'], ['halls', 'Halls'], ['categories', 'Categories']];

  return (
    <section className="admin">
      <h1 className="page-title">Manage</h1>
      <div className="chips">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'chip active' : 'chip'} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'events' && <EventsAdmin />}
      {tab === 'halls' && <HallsAdmin />}
      {tab === 'categories' && <CategoriesAdmin />}
    </section>
  );
}

function CategoriesAdmin() {
  const categories = useList('/api/categories');
  const [name, setName] = useState('');
  const [state, run] = useAction();

  async function submit(e) {
    e.preventDefault();
    if (await run(() => api('/api/categories', { method: 'POST', body: { name } }), 'Category added.')) {
      setName('');
      categories.reload();
    }
  }

  return (
    <>
      <form className="admin-card" onSubmit={submit}>
        <h2>Add a category</h2>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} /></label>
        <Notice state={state} listError={categories.error} />
        <button className="primary" disabled={state.busy}>Add category</button>
      </form>
      <AdminList items={categories.items} empty="No categories yet." render={(c) => <strong>{c.name}</strong>} />
    </>
  );
}

function HallsAdmin() {
  const halls = useList('/api/halls');
  const [form, setForm] = useState({ name: '', address: '', rows: '' });
  const [state, run] = useAction();
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const done = await run(async () => {
      // "8, 10, 12" -> [8, 10, 12]: three rows with 8, 10 and 12 seats.
      const rowSeatCounts = form.rows.split(/[\s,]+/).filter(Boolean).map(Number);
      if (rowSeatCounts.length === 0 || rowSeatCounts.some((n) => !Number.isInteger(n) || n < 1 || n > 100)) {
        throw new Error('Write the number of seats in each row, separated by commas. For example: 8, 10, 12');
      }
      await api('/api/halls', { method: 'POST', body: { name: form.name, address: form.address, rowSeatCounts } });
    }, 'Hall added.');

    if (done) {
      setForm({ name: '', address: '', rows: '' });
      halls.reload();
    }
  }

  async function remove(hall) {
    if (!window.confirm(`Delete the hall "${hall.name}"?`)) return;
    if (await run(() => api(`/api/halls/${hall.id}`, { method: 'DELETE' }), 'Hall deleted.')) halls.reload();
  }

  return (
    <>
      <form className="admin-card" onSubmit={submit}>
        <h2>Add a hall</h2>
        <label>Name<input value={form.name} onChange={update('name')} required minLength={2} maxLength={100} /></label>
        <label>Address<input value={form.address} onChange={update('address')} required maxLength={200} /></label>
        <label>
          Seats in each row, from the stage backwards
          <input value={form.rows} onChange={update('rows')} placeholder="8, 10, 10, 12" required />
        </label>
        <p className="hint">Every number is one row. "8, 10, 12" is a hall with 3 rows. The first row is the closest to the stage.</p>
        <Notice state={state} listError={halls.error} />
        <button className="primary" disabled={state.busy}>Add hall</button>
      </form>

      <AdminList
        items={halls.items}
        empty="No halls yet."
        busy={state.busy}
        onDelete={remove}
        render={(h) => (
          <>
            <strong>{h.name}</strong>
            <span className="hint">{h.address}, {h.rowSeatCounts.length} rows, {h.rowSeatCounts.reduce((a, b) => a + b, 0)} seats</span>
          </>
        )}
      />
    </>
  );
}

function EventsAdmin() {
  const events = useList('/api/events?pageSize=50&sortBy=Date');
  const halls = useList('/api/halls');
  const categories = useList('/api/categories');
  const empty = { title: '', description: '', startsAt: '', hallId: '', seatPrice: '', categoryIds: [] };
  const [form, setForm] = useState(empty);
  const [state, run] = useAction();
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleCategory = (id) => setForm({
    ...form,
    categoryIds: form.categoryIds.includes(id) ? form.categoryIds.filter((x) => x !== id) : [...form.categoryIds, id]
  });

  async function submit(e) {
    e.preventDefault();
    const body = {
      title: form.title,
      description: form.description || null,
      startsAt: new Date(form.startsAt).toISOString(),   // the field shows local time; the server wants UTC
      hallId: Number(form.hallId),
      seatPrice: Number(form.seatPrice),
      categoryIds: form.categoryIds
    };

    if (await run(() => api('/api/events', { method: 'POST', body }), 'Event added. Its seats were created from the hall.')) {
      setForm(empty);
      events.reload();
    }
  }

  async function remove(ev) {
    if (!window.confirm(`Delete the event "${ev.title}"?`)) return;
    // The server refuses (409) when the event already has bookings, and says so in the message.
    if (await run(() => api(`/api/events/${ev.id}`, { method: 'DELETE' }), 'Event deleted.')) events.reload();
  }

  return (
    <>
      <form className="admin-card" onSubmit={submit}>
        <h2>Add an event</h2>
        <label>Title<input value={form.title} onChange={update('title')} required minLength={2} maxLength={200} /></label>
        <label>Description (optional)<input value={form.description} onChange={update('description')} maxLength={2000} /></label>
        <div className="two">
          <label>Date and time<input type="datetime-local" value={form.startsAt} onChange={update('startsAt')} required /></label>
          <label>
            Hall
            <select value={form.hallId} onChange={update('hallId')} required>
              <option value="">Choose a hall</option>
              {halls.items.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
        </div>
        <label>
          Base price (₪)
          <input type="number" min="1" step="1" value={form.seatPrice} onChange={update('seatPrice')} required />
        </label>
        <p className="hint">The base price is for the back rows. The middle third costs 25% more and the front third costs 50% more.</p>

        <fieldset>
          <legend>Categories</legend>
          <div className="checks">
            {categories.items.map((c) => (
              <label key={c.id} className="inline">
                <input type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        <Notice state={state} listError={events.error || halls.error || categories.error} />
        <button className="primary" disabled={state.busy}>Add event</button>
      </form>

      <AdminList
        items={events.items}
        empty="No upcoming events."
        busy={state.busy}
        onDelete={remove}
        render={(ev) => (
          <>
            <strong>{ev.title}</strong>
            <span className="hint">{formatDate(ev.startsAt)}, {formatTime(ev.startsAt)}, {ev.hallName}</span>
          </>
        )}
      />
    </>
  );
}
