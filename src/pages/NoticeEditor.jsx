import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import NoticeForm from '../components/NoticeForm.jsx'
import { formatDate, getNoticeImageError } from '../lib/noticeUtils.js'
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from '../lib/supabase.js'

const IMAGE_BUCKET = 'notice-images'

async function uploadNoticeImage(noticeId, file) {
  const validationError = getNoticeImageError(file)
  if (validationError) return { error: new Error(validationError) }

  const filenameExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  const mimeExtension = file.type.split('/')[1]?.toLowerCase().replace(/[^a-z0-9]/g, '')
  const extension = filenameExtension?.length <= 10
    ? filenameExtension
    : mimeExtension?.slice(0, 10)
  const imagePath = `${noticeId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(imagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })
  if (uploadError) return { error: uploadError }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath)
  if (!data?.publicUrl) {
    const { error: cleanupError } = await supabase.storage.from(IMAGE_BUCKET).remove([imagePath])
    const error = new Error('Supabase did not return a public URL for the uploaded image.')
    if (cleanupError) error.message += ` Cleanup also failed: ${cleanupError.message}`
    return { error }
  }
  return { imageUrl: data.publicUrl, imagePath }
}

function NoticeEditor() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured)
  const [notices, setNotices] = useState([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deletingNoticeId, setDeletingNoticeId] = useState(null)

  const loadNotices = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoadingNotices(true)
    const { data, error: fetchError } = await supabase
      .from('notices')
      .select('id, title, content, category, priority, published_at, expires_at, image_url, image_path')
      .order('published_at', { ascending: false })
    if (fetchError) setError(`Couldn’t load the notice list. ${fetchError.message}`)
    else setNotices(data || [])
    setLoadingNotices(false)
  }, [])

  useEffect(() => {
    let isCurrent = true
    if (!isSupabaseConfigured) {
      return undefined
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isCurrent) return
      if (sessionError) setError(`Unable to check your session. ${sessionError.message}`)
      const currentSession = data?.session || null
      setSession(currentSession)
      if (currentSession) loadNotices()
      setCheckingSession(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) loadNotices()
      else setCheckingSession(false)
    })
    return () => {
      isCurrent = false
      subscription.unsubscribe()
    }
  }, [loadNotices])

  if (checkingSession) {
    return <main className="page-shell admin-shell"><div className="state-card" role="status"><span className="spinner" aria-hidden="true" /><h2>Checking admin access</h2></div></main>
  }
  if (!isSupabaseConfigured) {
    return <main className="page-shell admin-shell"><div className="state-card error-state" role="alert"><h1>Supabase setup required</h1><p>{supabaseConfigMessage}</p></div></main>
  }
  if (!session) return <Navigate to="/admin/login" replace state={{ from: '/admin' }} />

  async function saveNotice(values) {
    setError('')
    setMessage('')
    const imageError = getNoticeImageError(values.imageFile)
    if (imageError) {
      setError(imageError)
      return false
    }

    const payload = {
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      priority: values.priority,
      expires_at: values.expires_at,
      published_at: new Date(values.published_at).toISOString(),
    }

    if (!editingNotice) {
      const { data: createdNotice, error: createError } = await supabase
        .from('notices')
        .insert(payload)
        .select('id')
        .single()
      if (createError) {
        setError(`Couldn’t publish the notice. ${createError.message}`)
        return false
      }

      if (values.imageFile) {
        const uploaded = await uploadNoticeImage(createdNotice.id, values.imageFile)
        if (uploaded.error) {
          const { error: rollbackError } = await supabase
            .from('notices')
            .delete()
            .eq('id', createdNotice.id)
          setError(`The notice image could not be uploaded. ${uploaded.error.message}${rollbackError ? ` The new notice could not be rolled back: ${rollbackError.message}` : ''}`)
          await loadNotices()
          return false
        }

        const { error: imageUpdateError } = await supabase
          .from('notices')
          .update({ image_url: uploaded.imageUrl, image_path: uploaded.imagePath })
          .eq('id', createdNotice.id)
        if (imageUpdateError) {
          const { error: imageCleanupError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .remove([uploaded.imagePath])
          const { error: rowCleanupError } = await supabase
            .from('notices')
            .delete()
            .eq('id', createdNotice.id)
          setError(`The image was uploaded but the notice could not be updated. ${imageUpdateError.message}${imageCleanupError ? ` Image cleanup failed: ${imageCleanupError.message}` : ''}${rowCleanupError ? ` Notice cleanup failed: ${rowCleanupError.message}` : ''}`)
          await loadNotices()
          return false
        }
      }

      setMessage('Notice published successfully.')
    } else {
      let replacementImage = null
      if (values.imageFile) {
        replacementImage = await uploadNoticeImage(editingNotice.id, values.imageFile)
        if (replacementImage.error) {
          setError(`The replacement image could not be uploaded. ${replacementImage.error.message}`)
          return false
        }
      }

      const updatePayload = replacementImage
        ? { ...payload, image_url: replacementImage.imageUrl, image_path: replacementImage.imagePath }
        : payload
      const { error: updateError } = await supabase
        .from('notices')
        .update(updatePayload)
        .eq('id', editingNotice.id)
      if (updateError) {
        let cleanupMessage = ''
        if (replacementImage) {
          const { error: imageCleanupError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .remove([replacementImage.imagePath])
          if (imageCleanupError) cleanupMessage = ` The new image cleanup failed: ${imageCleanupError.message}`
        }
        setError(`Couldn’t update the notice. ${updateError.message}${cleanupMessage}`)
        return false
      }

      let oldImageWarning = ''
      if (replacementImage && editingNotice.image_path) {
        const { error: oldImageError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([editingNotice.image_path])
        if (oldImageError) {
          oldImageWarning = ` The notice was updated, but the previous image could not be removed: ${oldImageError.message}`
        }
      }
      setMessage(`Notice updated successfully.${oldImageWarning}`)
    }
    setEditingNotice(null)
    await loadNotices()
    return true
  }

  async function deleteNotice(notice) {
    const confirmed = window.confirm(`Delete “${notice.title}”? This action cannot be undone.`)
    if (!confirmed) return
    setError('')
    setMessage('')
    setDeletingNoticeId(notice.id)
    if (notice.image_path) {
      const { error: imageError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([notice.image_path])
      if (imageError) {
        setError(`Couldn’t delete the notice image. The notice was not deleted. ${imageError.message}`)
        setDeletingNoticeId(null)
        return
      }
    }
    const { error: deleteError } = await supabase.from('notices').delete().eq('id', notice.id)
    if (deleteError) {
      setError(`The notice image was deleted, but the notice row could not be deleted. ${deleteError.message}`)
      setDeletingNoticeId(null)
      return
    }
    if (editingNotice?.id === notice.id) setEditingNotice(null)
    setMessage('Notice deleted successfully.')
    await loadNotices()
    setDeletingNoticeId(null)
  }

  async function logout() {
    setError('')
    const { error: logoutError } = await supabase.auth.signOut()
    if (logoutError) {
      setError(`Couldn’t sign out. ${logoutError.message}`)
      return
    }
    setSession(null)
  }

  return (
    <main className="page-shell admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Noticeboard controls</p>
          <h1>Manage notices</h1>
          <p>Signed in as <strong>{session.user.email}</strong></p>
        </div>
        <button className="button button-secondary" onClick={logout} type="button">Sign out</button>
      </div>

      {message && <p className="success-banner" role="status">{message}</p>}
      {error && <p className="form-alert" role="alert">{error}</p>}

      <div className="admin-layout">
        <section className="admin-form-panel">
          <NoticeForm
            key={editingNotice?.id || 'new-notice'}
            initialValues={editingNotice}
            onCancel={() => setEditingNotice(null)}
            onSubmit={saveNotice}
          />
        </section>
        <section className="management-panel" aria-labelledby="manage-list-heading">
          <div className="management-heading">
            <div>
              <p className="eyebrow">Published content</p>
              <h2 id="manage-list-heading">All notices</h2>
            </div>
            <span className="management-count">{notices.length}</span>
          </div>
          {loadingNotices && <p className="inline-state" role="status">Refreshing notice list…</p>}
          {!loadingNotices && notices.length === 0 && <p className="inline-state">No notices yet. Create your first announcement.</p>}
          <div className="management-list">
            {notices.map((notice) => (
              <article className="management-item" key={notice.id}>
                <div className="management-item-copy">
                  <span className="category-badge">{notice.category}</span>
                  <h3>{notice.title}</h3>
                  <p>{notice.priority} · Expires {formatDate(notice.expires_at)}</p>
                </div>
                <div className="management-actions">
                  <button className="button button-small button-secondary" onClick={() => { setEditingNotice(notice); setMessage(''); setError('') }} type="button">Edit</button>
                  <button
                    className="button button-small button-danger"
                    disabled={deletingNoticeId === notice.id}
                    onClick={() => deleteNotice(notice)}
                    type="button"
                  >
                    {deletingNoticeId === notice.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default NoticeEditor
