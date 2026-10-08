import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate } from '../lib/noticeUtils.js'
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from '../lib/supabase.js'

function NoticeDetails() {
  const { id } = useParams()
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadNotice() {
      if (!isSupabaseConfigured) {
        setError(supabaseConfigMessage)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('id, title, content, category, priority, published_at, expires_at, image_url')
        .eq('id', id)
        .maybeSingle()

      if (!isCurrent) return
      if (fetchError) setError(`We couldn’t load this notice. ${fetchError.message}`)
      else if (!data) setMissing(true)
      else setNotice(data)
      setLoading(false)
    }

    loadNotice()
    return () => { isCurrent = false }
  }, [id])

  if (loading) {
    return <main className="page-shell detail-shell"><div className="state-card" role="status"><span className="spinner" aria-hidden="true" /><h2>Loading notice</h2><p>One moment, please.</p></div></main>
  }
  if (error || missing) {
    return (
      <main className="page-shell detail-shell">
        <div className={`state-card ${error ? 'error-state' : ''}`} role={error ? 'alert' : undefined}>
          <span className="state-icon" aria-hidden="true">{error ? '!' : '—'}</span>
          <h1>{error ? 'Notice unavailable' : 'Notice not found'}</h1>
          <p>{error || 'This notice may have expired or been removed.'}</p>
          <Link className="button button-primary" to="/">Return to notices</Link>
        </div>
      </main>
    )
  }

  const priority = (notice.priority || 'Normal').toLowerCase()

  return (
    <main className="page-shell detail-shell">
      <Link className="back-link" to="/">← Back to all notices</Link>
      <article className={`detail-card priority-${priority}`}>
        <div className="detail-badges">
          <span className="category-badge">{notice.category}</span>
          <span className={`priority-badge priority-label-${priority}`}>
            <span aria-hidden="true" className="priority-dot" />
            {notice.priority} priority
          </span>
        </div>
        <h1>{notice.title}</h1>
        {notice.image_url && (
          <img className="notice-detail-image" src={notice.image_url} alt={`Image for ${notice.title}`} />
        )}
        <div className="detail-dates">
          <span><strong>Published</strong>{formatDate(notice.published_at)}</span>
          <span><strong>Expires</strong>{formatDate(notice.expires_at)}</span>
        </div>
        <div className="detail-description">{notice.content}</div>
      </article>
    </main>
  )
}

export default NoticeDetails
