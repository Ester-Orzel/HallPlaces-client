import { useEffect, useState } from 'react';
import { api, formatTime } from '../api';
import Ticket from '../components/Ticket';
import HeroHall from '../components/HeroHall';
import { colorFor } from '../colors';

const PAGE_SIZE = 6;

// Screen 2: the events list. Paging, search, category filter and sorting are all done by the SERVER
// (Skip/Take in the database) - the client only sends the parameters and shows one page.
export default function EventsPage({ onOpen }) {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState({ page: 1, search: '', categoryId: '', sortBy: 'Date', descending: false });
  const [searchText, setSearchText] = useState('');
  const [result, setResult] = useState(null);   // PagedResult: { items, page, pageSize, totalCount, totalPages }
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/categories').then(setCategories).catch((err) => setError(err.message));
  }, []);

  // Runs again every time one of the query parameters changes.
  useEffect(() => {
    const params = new URLSearchParams({
      page: query.page,
      pageSize: PAGE_SIZE,
      sortBy: query.sortBy,
      descending: query.descending
    });
    if (query.search) params.set('search', query.search);
    if (query.categoryId) params.set('categoryId', query.categoryId);

    setError('');
    api(`/api/events?${params}`).then(setResult).catch((err) => setError(err.message));
  }, [query]);

  // Any change of filter/sort goes back to page 1.
  const change = (fields) => setQuery({ ...query, ...fields, page: 1 });

  return (
    <section>
      <div className="hero">
        <div className="hero-text">
          <h1>Your makom, reserved.</h1>
          <p>Shiurim, niggunim, family shows and gatherings. Pick an evening, pick a seat, and it is yours.</p>
        </div>
        <HeroHall />
      </div>

      {/* Category chips: one click filters the list on the server. */}
      <div className="chips">
        <button className={query.categoryId === '' ? 'chip active' : 'chip'} onClick={() => change({ categoryId: '' })}>
          All events
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={String(c.id) === String(query.categoryId) ? 'chip active' : 'chip'}
            style={{ '--accent': colorFor(c.id) }}
            onClick={() => change({ categoryId: c.id })}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="filters">
        <form onSubmit={(e) => { e.preventDefault(); change({ search: searchText.trim() }); }}>
          <input placeholder="Search by name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <button>Search</button>
        </form>

        <select value={query.sortBy} onChange={(e) => change({ sortBy: e.target.value })} aria-label="Sort by">
          <option value="Date">Sort by date</option>
          <option value="Title">Sort by name</option>
        </select>

        <label className="inline">
          <input type="checkbox" checked={query.descending} onChange={(e) => change({ descending: e.target.checked })} />
          Reverse order
        </label>
      </div>

      {error && <p className="alert error">{error}</p>}
      {!result && !error && <p className="empty">Loading events...</p>}

      {result && (
        <>
          {result.items.length === 0 && <p className="empty">No events match. Try another word or category.</p>}

          <div className="tickets grid">
            {result.items.map((ev) => (
              <Ticket key={ev.id} startsAt={ev.startsAt} title={ev.title} onClick={() => onOpen(ev.id)}
                      color={colorFor(ev.categories[0]?.id ?? ev.id)}
                      action={<span className="choose">Choose a seat</span>}>
                <p className="place">{formatTime(ev.startsAt)}, {ev.hallName}</p>
                <p className="tags">
                  {ev.categories.map((c) => <span key={c.id} style={{ '--accent': colorFor(c.id) }}>{c.name}</span>)}
                </p>
              </Ticket>
            ))}
          </div>

          <div className="pager">
            <button disabled={result.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button>
            <span>Page {result.page} of {Math.max(result.totalPages, 1)}, {result.totalCount} events</span>
            <button disabled={result.page >= result.totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
