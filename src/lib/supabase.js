import { createClient } from '@supabase/supabase-js'

// Check environment variables or local storage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('AKUNASISTEN_SUPABASE_URL') : null
const localKey = typeof window !== 'undefined' ? localStorage.getItem('AKUNASISTEN_SUPABASE_KEY') : null

const activeUrl = localUrl || envUrl
const activeKey = localKey || envKey

export const isSupabaseConfigured = () => {
  return (
    activeUrl &&
    activeUrl.startsWith('https://') &&
    !activeUrl.includes('your-project') &&
    activeKey &&
    !activeKey.includes('your-anon-key')
  )
}

// -------------------------------------------------------------
// LOCAL STORAGE MOCK CLIENT (Multi-Tenant & Strictly User-Isolated)
// -------------------------------------------------------------
const STORAGE_PREFIX = 'akunasisten_db_'

export const getTable = (tableName) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableName}`)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('Failed to get table', tableName, e)
    return []
  }
}

export const setTable = (tableName, data) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to set table', tableName, e)
  }
}

// Seed sample starter data ONLY for demo user (Bu Sari / riska@gmail.com)
export const initDemoDataIfNeeded = (userId, isDemoUser = false, businessName = 'Warung Makan Bu Sari') => {
  if (typeof window === 'undefined' || !isDemoUser) return

  // Seed sample products for this user only if they have none
  let products = getTable('products')
  const userProducts = products.filter(p => p.user_id === userId)
  if (userProducts.length === 0) {
    const defaultProducts = [
      {
        id: 'prod-' + userId + '-1',
        user_id: userId,
        name: 'Ayam Potong Segar (1 Ekor)',
        code: 'AYM-001',
        category: 'Bahan Baku',
        quantity: 25,
        buy_price: 35000,
        sell_price: 45000,
        unit: 'ekor',
        low_stock_threshold: 8,
        description: 'Bahan ayam ungkep dan goreng',
        created_at: new Date().toISOString(),
      },
      {
        id: 'prod-' + userId + '-2',
        user_id: userId,
        name: 'Beras Ramos Super 25kg',
        code: 'BRS-002',
        category: 'Bahan Baku',
        quantity: 4,
        buy_price: 310000,
        sell_price: 360000,
        unit: 'karung',
        low_stock_threshold: 5,
        description: 'Beras pulen untuk nasi warung',
        created_at: new Date().toISOString(),
      },
      {
        id: 'prod-' + userId + '-3',
        user_id: userId,
        name: 'Minyak Goreng Sawit 2L',
        code: 'MYK-003',
        category: 'Bahan Baku',
        quantity: 0,
        buy_price: 32000,
        sell_price: 38000,
        unit: 'pouch',
        low_stock_threshold: 6,
        description: 'Minyak goreng harian (Stok Habis)',
        created_at: new Date().toISOString(),
      },
      {
        id: 'prod-' + userId + '-4',
        user_id: userId,
        name: 'Sayur Mayur & Bumbu Dapur Paket',
        code: 'BMB-004',
        category: 'Bahan Baku',
        quantity: 15,
        buy_price: 15000,
        sell_price: 25000,
        unit: 'paket',
        low_stock_threshold: 5,
        description: 'Cabai, bawang, tomat, dan sayuran segar',
        created_at: new Date().toISOString(),
      },
    ]
    setTable('products', [...products, ...defaultProducts])
  }

  // Seed sample transactions matching prototype figures for this user only
  let tx = getTable('transactions')
  const userTx = tx.filter(t => t.user_id === userId)
  if (userTx.length === 0) {
    const defaultTx = [
      {
        id: 'tx-' + userId + '-1',
        user_id: userId,
        type: 'income',
        date: '2026-09-28',
        amount: 1250000,
        category: 'Penjualan',
        description: 'Penjualan harian',
        receipt_url: '',
        created_at: '2026-09-28T12:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-2',
        user_id: userId,
        type: 'expense',
        date: '2026-09-27',
        amount: 450000,
        category: 'Bahan baku',
        description: 'Beli ayam & sayur',
        receipt_url: '',
        created_at: '2026-09-27T10:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-3',
        user_id: userId,
        type: 'expense',
        date: '2026-09-26',
        amount: 320000,
        category: 'Operasional',
        description: 'Pembayaran listrik',
        receipt_url: '',
        created_at: '2026-09-26T09:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-4',
        user_id: userId,
        type: 'income',
        date: '2026-09-25',
        amount: 4100000,
        category: 'Penjualan',
        description: 'Pesanan prasmanan arisan kantor',
        receipt_url: '',
        created_at: '2026-09-25T14:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-5',
        user_id: userId,
        type: 'expense',
        date: '2026-09-24',
        amount: 5710000,
        category: 'Bahan baku',
        description: 'Belanja bahan baku mingguan pasar induk',
        receipt_url: '',
        created_at: '2026-09-24T06:30:00.000Z',
      },
      {
        id: 'tx-' + userId + '-6',
        user_id: userId,
        type: 'expense',
        date: '2026-09-20',
        amount: 2240000,
        category: 'Gaji',
        description: 'Gaji 2 staf dapur & kasir',
        receipt_url: '',
        created_at: '2026-09-20T16:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-7',
        user_id: userId,
        type: 'expense',
        date: '2026-09-18',
        amount: 1360000,
        category: 'Operasional',
        description: 'Gas LPG, air galon, & plastik mika',
        receipt_url: '',
        created_at: '2026-09-18T11:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-8',
        user_id: userId,
        type: 'expense',
        date: '2026-09-15',
        amount: 1120000,
        category: 'Lainnya',
        description: 'Perbaikan kompor & perlengkapan warung',
        receipt_url: '',
        created_at: '2026-09-15T15:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-9',
        user_id: userId,
        type: 'income',
        date: '2026-09-14',
        amount: 4800000,
        category: 'Penjualan',
        description: 'Penjualan makanan dan minuman minggu ke-2',
        receipt_url: '',
        created_at: '2026-09-14T19:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-10',
        user_id: userId,
        type: 'income',
        date: '2026-09-07',
        amount: 4200000,
        category: 'Penjualan',
        description: 'Penjualan makanan dan minuman minggu ke-1',
        receipt_url: '',
        created_at: '2026-09-07T19:00:00.000Z',
      },
      {
        id: 'tx-' + userId + '-11',
        user_id: userId,
        type: 'income',
        date: '2026-09-29',
        amount: 4100000,
        category: 'Penjualan',
        description: 'Penjualan makanan dan minuman minggu ke-4',
        receipt_url: '',
        created_at: '2026-09-29T19:00:00.000Z',
      },
    ]
    setTable('transactions', [...tx, ...defaultTx])
  }

  // Seed sample debts & receivables for this user only
  let debts = getTable('debts')
  const userDebts = debts.filter(d => d.user_id === userId)
  if (userDebts.length === 0) {
    setTable('debts', [
      ...debts,
      {
        id: 'debt-' + userId + '-1',
        user_id: userId,
        name: 'Agen Beras & Telur Pak Haji Mahmud',
        date: '2026-09-15',
        amount: 850000,
        due_date: '2026-10-05',
        description: 'Tagihan beras ramos & telur ayam 2 krat',
        status: 'unpaid',
        created_at: new Date().toISOString(),
      },
    ])
  }

  let receivables = getTable('receivables')
  const userRcv = receivables.filter(r => r.user_id === userId)
  if (userRcv.length === 0) {
    setTable('receivables', [
      ...receivables,
      {
        id: 'rcv-' + userId + '-1',
        user_id: userId,
        name: 'Kantin Sekolah Bintang Harapan',
        date: '2026-09-20',
        amount: 600000,
        due_date: '2026-10-02',
        description: 'Titipan nasi bungkus & snack arisan',
        status: 'unpaid',
        created_at: new Date().toISOString(),
      },
    ])
  }
}

// Function to seed sample starter data for any custom user upon their request
export const seedSampleDataForUser = (userId, businessName = 'Usaha Saya') => {
  const sampleTx = [
    {
      id: 'tx-' + userId + '-' + Date.now() + '-1',
      user_id: userId,
      type: 'income',
      date: '2026-09-28',
      amount: 2500000,
      category: 'Penjualan harian',
      description: `Penjualan harian ${businessName}`,
      receipt_url: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-' + userId + '-' + Date.now() + '-2',
      user_id: userId,
      type: 'expense',
      date: '2026-09-27',
      amount: 850000,
      category: 'Bahan baku',
      description: `Beli stok persediaan ${businessName}`,
      receipt_url: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-' + userId + '-' + Date.now() + '-3',
      user_id: userId,
      type: 'expense',
      date: '2026-09-26',
      amount: 350000,
      category: 'Operasional',
      description: `Biaya operasional & utilitas ${businessName}`,
      receipt_url: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-' + userId + '-' + Date.now() + '-4',
      user_id: userId,
      type: 'income',
      date: '2026-09-20',
      amount: 3200000,
      category: 'Penjualan harian',
      description: `Pesanan produk ${businessName}`,
      receipt_url: '',
      created_at: new Date().toISOString(),
    },
  ]
  const allTx = getTable('transactions')
  setTable('transactions', [...allTx, ...sampleTx])
}

export const ensureDemoUserExists = () => {
  if (typeof window === 'undefined') return
  try {
    let users = getTable('users')
    let demoUser = users.find(u => u.email.toLowerCase() === 'riska@gmail.com')
    const demoUserId = 'demo_user_bu_sari'
    if (!demoUser) {
      demoUser = {
        id: demoUserId,
        email: 'riska@gmail.com',
        password: 'password123',
        user_metadata: {
          full_name: 'Bu Sari',
          business_name: 'Warung Makan Bu Sari',
        },
        created_at: '2026-09-01T00:00:00.000Z',
      }
      users.push(demoUser)
      setTable('users', users)
    }

    let profiles = getTable('profiles')
    let demoProfile = profiles.find(p => p.id === demoUser.id || p.email.toLowerCase() === 'riska@gmail.com')
    if (!demoProfile) {
      demoProfile = {
        id: demoUser.id,
        email: 'riska@gmail.com',
        full_name: 'Bu Sari',
        business_name: 'Warung Makan Bu Sari',
        phone: '081234567890',
        address: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
        avatar_url: '',
        created_at: '2026-09-01T00:00:00.000Z',
      }
      profiles.push(demoProfile)
      setTable('profiles', profiles)
    }

    // Seed sample data for demoUser.id
    initDemoDataIfNeeded(demoUser.id, true, 'Warung Makan Bu Sari')
  } catch (e) {
    console.error('Error ensuring demo user:', e)
  }
}
ensureDemoUserExists()

// Mock query builder
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName
    this.filters = []
    this.orderConfig = null
    this.limitCount = null
    this.isSingle = false
    this.action = 'select'
    this.actionPayload = null
    this.selectColumns = '*'
  }

  select(columns = '*') {
    this.selectColumns = columns
    this.action = 'select'
    return this
  }

  eq(column, value) {
    this.filters.push({ column, op: 'eq', value })
    return this
  }

  neq(column, value) {
    this.filters.push({ column, op: 'neq', value })
    return this
  }

  gte(column, value) {
    this.filters.push({ column, op: 'gte', value })
    return this
  }

  lte(column, value) {
    this.filters.push({ column, op: 'lte', value })
    return this
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending }
    return this
  }

  limit(count) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  insert(rows) {
    this.action = 'insert'
    this.actionPayload = Array.isArray(rows) ? rows : [rows]
    return this
  }

  update(values) {
    this.action = 'update'
    this.actionPayload = values
    return this
  }

  upsert(row) {
    this.action = 'upsert'
    this.actionPayload = row
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  async then(resolve, reject) {
    try {
      const res = await this._execute()
      resolve(res)
    } catch (err) {
      if (reject) reject(err)
      else resolve({ data: null, error: err })
    }
  }

  async _execute() {
    let items = getTable(this.tableName)

    if (this.action === 'insert') {
      const newItems = this.actionPayload.map((item) => ({
        id: item.id || 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
        created_at: new Date().toISOString(),
        ...item,
      }))
      items = [...items, ...newItems]
      setTable(this.tableName, items)
      return {
        data: this.isSingle ? newItems[0] : newItems,
        error: null,
      }
    }

    if (this.action === 'upsert') {
      const item = this.actionPayload
      const existingIdx = items.findIndex((x) => x.id === item.id)
      let saved
      if (existingIdx >= 0) {
        items[existingIdx] = { ...items[existingIdx], ...item, updated_at: new Date().toISOString() }
        saved = items[existingIdx]
      } else {
        saved = {
          id: item.id || 'id_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...item,
        }
        items.push(saved)
      }
      setTable(this.tableName, items)
      return {
        data: this.isSingle ? saved : [saved],
        error: null,
      }
    }

    if (this.action === 'update') {
      const updated = []
      items = items.map((item) => {
        const match = this._matches(item)
        if (match) {
          const newItem = { ...item, ...this.actionPayload, updated_at: new Date().toISOString() }
          updated.push(newItem)
          return newItem
        }
        return item
      })
      setTable(this.tableName, items)
      return {
        data: this.isSingle ? updated[0] || null : updated,
        error: null,
      }
    }

    if (this.action === 'delete') {
      items = items.filter((item) => !this._matches(item))
      setTable(this.tableName, items)
      return {
        data: null,
        error: null,
      }
    }

    // Default: SELECT
    let result = items.filter((item) => this._matches(item))

    // Handle relations (e.g. debt_payments(*), receivable_payments(*))
    if (this.selectColumns.includes('debt_payments(*)')) {
      const allPayments = getTable('debt_payments')
      result = result.map((debt) => ({
        ...debt,
        debt_payments: allPayments.filter((p) => p.debt_id === debt.id),
      }))
    }
    if (this.selectColumns.includes('receivable_payments(*)')) {
      const allPayments = getTable('receivable_payments')
      result = result.map((rcv) => ({
        ...rcv,
        receivable_payments: allPayments.filter((p) => p.receivable_id === rcv.id),
      }))
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig
      result.sort((a, b) => {
        let valA = a[column]
        let valB = b[column]
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        if (typeof valA === 'string') {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return ascending ? valA - valB : valB - valA
      })
    }

    if (this.limitCount) {
      result = result.slice(0, this.limitCount)
    }

    if (this.isSingle) {
      return {
        data: result[0] || null,
        error: result[0] ? null : { message: 'Row not found' },
      }
    }

    return {
      data: result,
      error: null,
    }
  }

  _matches(item) {
    for (const filter of this.filters) {
      const val = item[filter.column]
      if (filter.op === 'eq' && val !== filter.value) return false
      if (filter.op === 'neq' && val === filter.value) return false
      if (filter.op === 'gte' && (val === undefined || val < filter.value)) return false
      if (filter.op === 'lte' && (val === undefined || val > filter.value)) return false
    }
    return true
  }
}

// Mock auth engine
const authListeners = []

const mockAuth = {
  async getSession() {
    try {
      const sessionRaw = localStorage.getItem('akunasisten_auth_session')
      const session = sessionRaw ? JSON.parse(sessionRaw) : null
      return { data: { session }, error: null }
    } catch (e) {
      return { data: { session: null }, error: null }
    }
  },

  onAuthStateChange(callback) {
    authListeners.push(callback)
    this.getSession().then(({ data: { session } }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    })
    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = authListeners.indexOf(callback)
            if (idx >= 0) authListeners.splice(idx, 1)
          },
        },
      },
    }
  },

  async signUp({ email, password, options = {} }) {
    if (!email || !password) {
      return { data: { user: null }, error: new Error('Email dan password wajib diisi!') }
    }
    const users = getTable('users')
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      return { data: { user: null }, error: new Error('Email sudah terdaftar. Silakan masuk!') }
    }

    const userId = 'usr_' + Math.random().toString(36).substr(2, 9)
    const emailLower = email.toLowerCase().trim()
    const isDemo = emailLower === 'riska@gmail.com' || emailLower === 'demo@akunasisten.id'

    const userName = emailLower.split('@')[0]
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

    const finalFullName = options.data?.full_name || (isDemo ? 'Bu Sari' : capitalizedName)
    const finalBusinessName = options.data?.business_name || (isDemo ? 'Warung Makan Bu Sari' : `Usaha ${capitalizedName}`)

    const newUser = {
      id: userId,
      email: emailLower,
      password,
      user_metadata: {
        ...options.data,
        full_name: finalFullName,
        business_name: finalBusinessName,
      },
      created_at: new Date().toISOString(),
    }
    users.push(newUser)
    setTable('users', users)

    // Create profile
    const profile = {
      id: userId,
      email: emailLower,
      full_name: finalFullName,
      business_name: finalBusinessName,
      created_at: new Date().toISOString(),
    }
    const profiles = getTable('profiles')
    profiles.push(profile)
    setTable('profiles', profiles)

    // ONLY seed prototype demo data if it's explicitly the demo account
    if (isDemo) {
      initDemoDataIfNeeded(userId, true, finalBusinessName)
    }

    const session = {
      access_token: 'local_token_' + Date.now(),
      user: {
        id: userId,
        email: newUser.email,
        user_metadata: newUser.user_metadata,
      },
    }
    localStorage.setItem('akunasisten_auth_session', JSON.stringify(session))

    authListeners.forEach((fn) => fn('SIGNED_IN', session))

    return {
      data: { user: session.user, session },
      error: null,
    }
  },

  async signInWithPassword({ email, password }) {
    if (!email || !password) {
      return { data: { user: null, session: null }, error: new Error('Email dan password wajib diisi!') }
    }

    let users = getTable('users')
    const emailLower = email.toLowerCase()

    let matched = users.find(
      (u) => u.email.toLowerCase() === emailLower && u.password === password
    )

    if (!matched) {
      const userWithEmail = users.find((u) => u.email.toLowerCase() === emailLower)
      if (userWithEmail) {
        return { data: { user: null, session: null }, error: new Error('Password salah. Periksa kembali password Anda.') }
      }

      // If user doesn't exist yet, auto-register with THEIR OWN name & business
      const userName = emailLower.split('@')[0]
      const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)
      const isDemo = emailLower === 'riska@gmail.com' || emailLower === 'demo@akunasisten.id'

      const res = await this.signUp({
        email,
        password,
        options: {
          data: {
            full_name: isDemo ? 'Bu Sari' : capitalizedName,
            business_name: isDemo ? 'Warung Makan Bu Sari' : `Usaha ${capitalizedName}`,
          },
        },
      })
      return res
    }

    // Ensure profile exists for matched user
    const profiles = getTable('profiles')
    let userProfile = profiles.find(p => p.id === matched.id)
    if (!userProfile) {
      userProfile = {
        id: matched.id,
        email: matched.email,
        full_name: matched.user_metadata?.full_name || 'Pemilik Usaha',
        business_name: matched.user_metadata?.business_name || 'Usaha Saya',
        created_at: new Date().toISOString(),
      }
      profiles.push(userProfile)
      setTable('profiles', profiles)
    }

    const session = {
      access_token: 'local_token_' + Date.now(),
      user: {
        id: matched.id,
        email: matched.email,
        user_metadata: {
          ...matched.user_metadata,
          full_name: userProfile.full_name,
          business_name: userProfile.business_name,
        },
      },
    }
    localStorage.setItem('akunasisten_auth_session', JSON.stringify(session))

    authListeners.forEach((fn) => fn('SIGNED_IN', session))

    return {
      data: { user: session.user, session },
      error: null,
    }
  },

  async signOut() {
    localStorage.removeItem('akunasisten_auth_session')
    authListeners.forEach((fn) => fn('SIGNED_OUT', null))
    return { error: null }
  },

  async updateUser({ password }) {
    const sessionRaw = localStorage.getItem('akunasisten_auth_session')
    if (!sessionRaw) return { error: new Error('Belum login') }
    const session = JSON.parse(sessionRaw)
    const users = getTable('users')
    const idx = users.findIndex((u) => u.id === session.user.id)
    if (idx >= 0) {
      users[idx].password = password
      setTable('users', users)
    }
    return { data: { user: session.user }, error: null }
  },
}

// Mock storage engine
const mockStorage = {
  from(bucketName) {
    return {
      async upload(filename, file) {
        return new Promise((resolve) => {
          if (!file) {
            resolve({ data: null, error: new Error('File tidak ditemukan') })
            return
          }
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target.result
            try {
              localStorage.setItem(`storage_${bucketName}_${filename}`, dataUrl)
            } catch (err) {
              console.warn('Storage quota limit, keeping in memory map')
            }
            resolve({ data: { path: filename }, error: null })
          }
          reader.onerror = () => resolve({ data: null, error: new Error('Gagal membaca file') })
          reader.readAsDataURL(file)
        })
      },

      getPublicUrl(filename) {
        const savedUrl = localStorage.getItem(`storage_${bucketName}_${filename}`)
        return {
          data: {
            publicUrl: savedUrl || '/logo.png',
          },
        }
      },
    }
  },
}

// -------------------------------------------------------------
// HYBRID CLIENT
// -------------------------------------------------------------
let realSupabaseClient = null
if (isSupabaseConfigured()) {
  try {
    realSupabaseClient = createClient(activeUrl, activeKey)
  } catch (e) {
    console.warn('Could not initialize real Supabase client, using local mock engine:', e)
  }
}

export const supabase = {
  auth: {
    async getSession() {
      if (realSupabaseClient) {
        try {
          return await realSupabaseClient.auth.getSession()
        } catch (e) { }
      }
      return mockAuth.getSession()
    },

    onAuthStateChange(callback) {
      if (realSupabaseClient) {
        try {
          return realSupabaseClient.auth.onAuthStateChange(callback)
        } catch (e) { }
      }
      return mockAuth.onAuthStateChange(callback)
    },

    async signInWithPassword(credentials) {
      if (realSupabaseClient) {
        try {
          const res = await realSupabaseClient.auth.signInWithPassword(credentials)
          if (!res.error) return res
          if (res.error?.message?.includes('fetch') || res.error?.status === 0) {
            return mockAuth.signInWithPassword(credentials)
          }
          return res
        } catch (e) {
          return mockAuth.signInWithPassword(credentials)
        }
      }
      return mockAuth.signInWithPassword(credentials)
    },

    async signUp(params) {
      if (realSupabaseClient) {
        try {
          const res = await realSupabaseClient.auth.signUp(params)
          if (!res.error) return res
          if (res.error?.message?.includes('fetch') || res.error?.status === 0) {
            return mockAuth.signUp(params)
          }
          return res
        } catch (e) {
          return mockAuth.signUp(params)
        }
      }
      return mockAuth.signUp(params)
    },

    async signOut() {
      if (realSupabaseClient) {
        try {
          await realSupabaseClient.auth.signOut()
        } catch (e) { }
      }
      return mockAuth.signOut()
    },

    async updateUser(updates) {
      if (realSupabaseClient) {
        try {
          return await realSupabaseClient.auth.updateUser(updates)
        } catch (e) { }
      }
      return mockAuth.updateUser(updates)
    },
  },

  from(tableName) {
    if (realSupabaseClient) {
      try {
        const query = realSupabaseClient.from(tableName)
        return query
      } catch (e) { }
    }
    return new MockQueryBuilder(tableName)
  },

  storage: {
    from(bucketName) {
      if (realSupabaseClient) {
        try {
          return realSupabaseClient.storage.from(bucketName)
        } catch (e) { }
      }
      return mockStorage.from(bucketName)
    },
  },
}
