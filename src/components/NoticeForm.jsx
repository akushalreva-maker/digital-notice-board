import { useEffect, useRef, useState } from 'react'
import {
  CATEGORIES,
  currentLocalDateTimeInput,
  getNoticeImageError,
  PRIORITIES,
  toLocalDateTimeInput,
} from '../lib/noticeUtils.js'

function createEmptyNotice() {
  return {
    title: '',
    content: '',
    category: 'General',
    priority: 'Normal',
    published_at: currentLocalDateTimeInput(),
    expires_at: '',
  }
}

function NoticeForm({ initialValues, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({
    ...createEmptyNotice(),
    ...initialValues,
    published_at: toLocalDateTimeInput(initialValues?.published_at)
      || currentLocalDateTimeInput(),
    expires_at: initialValues?.expires_at?.slice(0, 10) || '',
  }))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initialValues?.image_url || '')
  const [imageError, setImageError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const previewUrlRef = useRef(null)
  const isEditing = Boolean(initialValues?.id)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function updateField(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateImage(event) {
    const file = event.target.files?.[0] || null
    const validationError = getNoticeImageError(file)
    setImageError(validationError)
    if (!validationError) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = file ? URL.createObjectURL(file) : null
      setImageFile(file)
      setImagePreview(previewUrlRef.current || initialValues?.image_url || '')
    }
    event.target.value = ''
  }

  function clearSelectedImage() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setImageFile(null)
    setImagePreview(initialValues?.image_url || '')
    setImageError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (imageError) return
    setSubmitting(true)
    try {
      const succeeded = await onSubmit({ ...values, imageFile })
      if (succeeded && !isEditing) {
        setValues(createEmptyNotice())
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
        setImageFile(null)
        setImagePreview(initialValues?.image_url || '')
        setImageError('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="notice-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'Update a notice' : 'New announcement'}</p>
          <h2>{isEditing ? 'Edit notice' : 'Create a notice'}</h2>
        </div>
        {isEditing && (
          <button className="button button-quiet" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <label className="field">
        <span>Notice title <span className="required-mark">*</span></span>
        <input
          autoComplete="off"
          maxLength="180"
          name="title"
          onChange={updateField}
          placeholder="e.g. Semester examination timetable"
          required
          value={values.title}
        />
      </label>

      <label className="field">
        <span>Description <span className="required-mark">*</span></span>
        <textarea
          name="content"
          onChange={updateField}
          placeholder="Share the details students need to know..."
          required
          rows="6"
          value={values.content}
        />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Category <span className="required-mark">*</span></span>
          <select name="category" onChange={updateField} required value={values.category}>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Priority <span className="required-mark">*</span></span>
          <select name="priority" onChange={updateField} required value={values.priority}>
            {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Published date <span className="required-mark">*</span></span>
        <input
          name="published_at"
          onChange={updateField}
          required
          type="datetime-local"
          value={values.published_at}
        />
      </label>

      <label className="field">
        <span>Expiry date <span className="required-mark">*</span></span>
        <input
          name="expires_at"
          onChange={updateField}
          required
          type="date"
          value={values.expires_at}
        />
      </label>

      <label className="field">
        <span>Notice image <span className="optional-label">(optional, max 5 MB)</span></span>
        <input accept="image/*" name="image" onChange={updateImage} type="file" />
      </label>
      {imageError && <p className="form-alert" role="alert">{imageError}</p>}
      {imagePreview && (
        <div className="image-preview-wrap">
          <img className="image-preview" src={imagePreview} alt="Notice image preview" />
          {imageFile && (
            <button
              className="button button-quiet button-small"
              onClick={clearSelectedImage}
              type="button"
            >
              Clear selected image
            </button>
          )}
        </div>
      )}

      <button className="button button-primary form-submit" disabled={submitting || Boolean(imageError)} type="submit">
        {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Publish notice'}
      </button>
    </form>
  )
}

export default NoticeForm
