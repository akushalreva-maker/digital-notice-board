import { useEffect, useMemo, useState } from 'react'
import NoticeCard from '../components/NoticeCard.jsx'
import { CATEGORIES, PRIORITIES, todayAsDateString } from '../lib/noticeUtils.js'
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from '../lib/supabase.js'

function Home() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadNotices() {
      if (!isSupabaseConfigured) {
        setError(supabaseConfigMessage)
        setLoading(false)
        return
      }
      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('id, title, content, category, priority, published_at, expires_at, image_url')
        .gte('expires_at', todayAsDateString())
        .order('published_at', { ascending: false })

      if (!isCurrent) return
      if (fetchError) {
        setError(`We couldn’t load notices. ${fetchError.message}`)
      } else {
        setNotices(data || [])
      }
      setLoading(false)
    }

    loadNotices()
    return () => { isCurrent = false }
  }, [])

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase()
    return notices.filter((notice) => {
      const matchesSearch = !query
        || notice.title.toLowerCase().includes(query)
        || notice.content.toLowerCase().includes(query)
      return matchesSearch
        && (!category || notice.category === category)
        && (!priority || notice.priority === priority)
    })
  }, [notices, search, category, priority])

  return (
    <main>
      <section className="hero-band">
        <div className="page-shell hero-content">
          <p className="eyebrow hero-eyebrow">Campus updates, all in one place</p>
          <h1>Stay in the know.</h1>
          <p className="hero-copy">
            The latest announcements, opportunities and important dates from across campus.
          </p>
          <div className="hero-note"><span aria-hidden="true">✦</span> Your campus, up to date</div>
        </div>
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
      </section>

      <section className="page-shell notices-section" aria-labelledby="notices-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The noticeboard</p>
            <h2 id="notices-heading">Latest notices</h2>
          </div>
          {!loading && !error && (
            <span className="result-count">{filteredNotices.length} {filteredNotices.length === 1 ? 'notice' : 'notices'}</span>
          )}
        </div>

        <div className="filter-bar">
          <label className="search-field">
            <span className="sr-only">Search notices</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notices..."
              type="search"
              value={search}
            />
          </label>
          <label className="filter-field">
            <span className="sr-only">Filter by category</span>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="">All categories</option>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span className="sr-only">Filter by priority</span>
            <select onChange={(event) => setPriority(event.target.value)} value={priority}>
              <option value="">All priorities</option>
              {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {loading && (
          <div className="state-card" role="status">
            <span className="spinner" aria-hidden="true" />
            <h2>Loading notices</h2>
            <p>Getting the latest updates from your campus.</p>
          </div>
        )}
        {!loading && error && (
          <div className="state-card error-state" role="alert">
            <span className="state-icon" aria-hidden="true">!</span>
            <h2>Notices are unavailable</h2>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && filteredNotices.length === 0 && (
          <div className="state-card">
            <span className="state-icon" aria-hidden="true">⌕</span>
            <h2>{notices.length ? 'No matching notices' : 'Nothing new right now'}</h2>
            <p>{notices.length
              ? 'Try a different search or adjust the filters.'
              : 'There are no active notices at the moment. Check back soon.'}</p>
          </div>
        )}
        {!loading && !error && filteredNotices.length > 0 && (
          <div className="notice-grid">
            {filteredNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}
          </div>
        )}
      </section>
      <footer className="site-footer">
        <div className="page-shell">Digital Notice Board <span>·</span> Campus information, made clear.</div>
      </footer>
    </main>
  )
}

export default Home
