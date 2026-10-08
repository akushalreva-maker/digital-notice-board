import { Link } from 'react-router-dom'
import { formatDate } from '../lib/noticeUtils.js'

function NoticeCard({ notice }) {
  const priority = (notice.priority || 'Normal').toLowerCase()

  return (
    <article className={`notice-card priority-${priority}`}>
      <div className="notice-card-topline">
        <span className="category-badge">{notice.category}</span>
        <span className={`priority-badge priority-label-${priority}`}>
          <span aria-hidden="true" className="priority-dot" />
          {notice.priority} priority
        </span>
      </div>
      {notice.image_url && (
        <img className="notice-card-image" src={notice.image_url} alt="" loading="lazy" />
      )}
      <h2 className="notice-card-title">
        <Link to={`/notice/${notice.id}`}>{notice.title}</Link>
      </h2>
      <p className="notice-excerpt">{notice.content}</p>
      <div className="notice-card-footer">
        <div className="date-pair">
          <span><strong>Posted</strong> {formatDate(notice.published_at)}</span>
          <span><strong>Expires</strong> {formatDate(notice.expires_at)}</span>
        </div>
        <Link className="text-link" to={`/notice/${notice.id}`}>
          View details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default NoticeCard
