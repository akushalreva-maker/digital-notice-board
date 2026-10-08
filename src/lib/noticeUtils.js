export const CATEGORIES = [
  'Academic',
  'Examination',
  'Events',
  'Placements',
  'General',
]

export const PRIORITIES = ['Normal', 'Important', 'Urgent']
export const MAX_NOTICE_IMAGE_SIZE = 5 * 1024 * 1024

export function getNoticeImageError(file) {
  if (!file) return ''
  if (!file.type.startsWith('image/')) return 'Choose an image file.'
  if (file.size > MAX_NOTICE_IMAGE_SIZE) return 'Image files must be 5 MB or smaller.'
  return ''
}

export function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

export function currentLocalDateTimeInput() {
  return toLocalDateTimeInput(new Date().toISOString())
}

export function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function todayAsDateString() {
  const today = new Date()
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  )
  return localDate.toISOString().slice(0, 10)
}
