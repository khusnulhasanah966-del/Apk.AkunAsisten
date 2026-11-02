// Format currency to Indonesian Rupiah
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date to Indonesian format
export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Format date short
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

// Format month/year
export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Get current month in YYYY-MM format
export const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Get months for filter
export const getMonthOptions = () => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d),
    })
  }
  return months
}

// Calculate days until due date
export const daysUntilDue = (dueDateStr) => {
  if (!dueDateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

// Truncate text
export const truncate = (str, n) => {
  if (!str) return ''
  return str.length > n ? str.substr(0, n - 1) + '...' : str
}

// Generate unique ID
export const generateId = () => Math.random().toString(36).substr(2, 9)

// Parse number from formatted string
export const parseRupiah = (str) => {
  if (typeof str === 'number') return str
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0
}
