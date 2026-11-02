import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, seedSampleDataForUser } from '../lib/supabase'
import { formatRupiah, formatDate } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Download, ArrowUpRight, ArrowDownRight,
  RefreshCw, Plus, ChevronDown, Check, X
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const PIE_COLORS = {
  'Bahan baku': '#f05080',
  'Gaji': '#1e1e1e',
  'Operasional': '#f8719d',
  'Lainnya': '#fbcfe8',
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2026-09')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const datePickerRef = useRef(null)

  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(9)
  const [seeding, setSeeding] = useState(false)

  const businessName = profile?.business_name || user?.user_metadata?.business_name || (user?.email ? `Usaha ${user.email.split('@')[0]}` : 'Usaha Saya')
  const ownerName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Pemilik Usaha')
  const isDemo = user?.email?.toLowerCase() === 'riska@gmail.com' || user?.email?.toLowerCase() === 'demo@akunasisten.id'

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    profit: 0,
    balance: 0,
    margin: 0,
  })
  const [weeklyData, setWeeklyData] = useState([
    { week: 'Mg 1', Masuk: 0, Keluar: 0 },
    { week: 'Mg 2', Masuk: 0, Keluar: 0 },
    { week: 'Mg 3', Masuk: 0, Keluar: 0 },
    { week: 'Mg 4', Masuk: 0, Keluar: 0 },
  ])
  const [pieData, setPieData] = useState([])
  const [recentTx, setRecentTx] = useState([])

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    try {
      const [year, month] = period.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      const txList = txData || []

      // Calculate balance from all transactions up to endDate
      const { data: allHistData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .lte('date', endDate)

      const allHist = allHistData || []
      const totalHistIncome = allHist.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalHistExpense = allHist.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const startingCapital = Number(localStorage.getItem(`akunasisten_modal_awal_${user.id}`)) || (isDemo ? 2550000 : 0)
      const calculatedBalance = startingCapital + totalHistIncome - totalHistExpense

      if (txList.length > 0) {
        const income = txList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const profit = income - expense
        const margin = income > 0 ? Math.round((profit / income) * 100) : 0

        setSummary({ income, expense, profit, balance: calculatedBalance, margin })
        setRecentTx(txList.slice(0, 5))

        // Compute 4 weekly buckets
        const w1Inc = txList.filter(t => t.type === 'income' && parseInt(t.date.split('-')[2]) <= 7).reduce((s, t) => s + Number(t.amount), 0)
        const w1Exp = txList.filter(t => t.type === 'expense' && parseInt(t.date.split('-')[2]) <= 7).reduce((s, t) => s + Number(t.amount), 0)

        const w2Inc = txList.filter(t => t.type === 'income' && parseInt(t.date.split('-')[2]) > 7 && parseInt(t.date.split('-')[2]) <= 14).reduce((s, t) => s + Number(t.amount), 0)
        const w2Exp = txList.filter(t => t.type === 'expense' && parseInt(t.date.split('-')[2]) > 7 && parseInt(t.date.split('-')[2]) <= 14).reduce((s, t) => s + Number(t.amount), 0)

        const w3Inc = txList.filter(t => t.type === 'income' && parseInt(t.date.split('-')[2]) > 14 && parseInt(t.date.split('-')[2]) <= 21).reduce((s, t) => s + Number(t.amount), 0)
        const w3Exp = txList.filter(t => t.type === 'expense' && parseInt(t.date.split('-')[2]) > 14 && parseInt(t.date.split('-')[2]) <= 21).reduce((s, t) => s + Number(t.amount), 0)

        const w4Inc = txList.filter(t => t.type === 'income' && parseInt(t.date.split('-')[2]) > 21).reduce((s, t) => s + Number(t.amount), 0)
        const w4Exp = txList.filter(t => t.type === 'expense' && parseInt(t.date.split('-')[2]) > 21).reduce((s, t) => s + Number(t.amount), 0)

        setWeeklyData([
          { week: 'Mg 1', Masuk: +(w1Inc / 1000000).toFixed(2), Keluar: +(w1Exp / 1000000).toFixed(2) },
          { week: 'Mg 2', Masuk: +(w2Inc / 1000000).toFixed(2), Keluar: +(w2Exp / 1000000).toFixed(2) },
          { week: 'Mg 3', Masuk: +(w3Inc / 1000000).toFixed(2), Keluar: +(w3Exp / 1000000).toFixed(2) },
          { week: 'Mg 4', Masuk: +(w4Inc / 1000000).toFixed(2), Keluar: +(w4Exp / 1000000).toFixed(2) },
        ])

        // Compute composition
        const catCounts = {}
        txList.filter(t => t.type === 'expense').forEach(t => {
          let cat = t.category || 'Lainnya'
          if (cat.toLowerCase().includes('bahan')) cat = 'Bahan baku'
          else if (cat.toLowerCase().includes('gaji')) cat = 'Gaji'
          else if (cat.toLowerCase().includes('operasional') || cat.toLowerCase().includes('listrik') || cat.toLowerCase().includes('sewa')) cat = 'Operasional'
          else cat = 'Lainnya'
          catCounts[cat] = (catCounts[cat] || 0) + Number(t.amount)
        })

        const totalExp = Object.values(catCounts).reduce((a, b) => a + b, 0)
        if (totalExp > 0) {
          const defaultCategories = ['Bahan baku', 'Gaji', 'Operasional', 'Lainnya']
          const comps = defaultCategories.map(cat => {
            const amt = catCounts[cat] || 0
            const pct = Math.round((amt / totalExp) * 100)
            return {
              name: cat,
              value: pct,
              amount: amt,
              color: PIE_COLORS[cat] || '#ec4899',
            }
          })
          setPieData(comps)
        } else {
          setPieData([])
        }
      } else {
        // Fallback if no transactions in chosen period
        setSummary({
          income: 0,
          expense: 0,
          profit: 0,
          balance: calculatedBalance,
          margin: 0,
        })
        setWeeklyData([
          { week: 'Mg 1', Masuk: 0, Keluar: 0 },
          { week: 'Mg 2', Masuk: 0, Keluar: 0 },
          { week: 'Mg 3', Masuk: 0, Keluar: 0 },
          { week: 'Mg 4', Masuk: 0, Keluar: 0 },
        ])
        setPieData([])
        setRecentTx([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, period, isDemo])

  const handleSeedCustomData = async () => {
    if (!user) return
    setSeeding(true)
    try {
      seedSampleDataForUser(user.id, businessName)
      await fetchDashboardData()
    } catch (e) {
      console.error(e)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleApplyDate = (y, m) => {
    const formatted = `${y}-${String(m).padStart(2, '0')}`
    setPeriod(formatted)
    setShowDatePicker(false)
  }

  // Current display label e.g. "September 2026"
  const getDisplayPeriod = () => {
    const [y, m] = period.split('-')
    const monthIndex = parseInt(m) - 1
    return `${MONTH_NAMES[monthIndex]} ${y}`
  }

  const formatDateShort = (dStr) => {
    if (!dStr) return '-'
    const d = new Date(dStr)
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${day} ${months[d.getMonth()]}`
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row (Prototype: "Dashboard Keuangan", Business Name, Date Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Dashboard Keuangan
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">
            {businessName}
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative">
          {/* Interactive Date Pill Button (Can be clicked!) */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="bg-pink-100/80 hover:bg-pink-200/80 border border-pink-200/80 rounded-full px-5 py-2 flex items-center gap-2 text-[#f05080] text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 group"
              title="Klik untuk mengubah periode tanggal"
            >
              <Calendar size={14} className="group-hover:rotate-12 transition-transform" />
              <span>{getDisplayPeriod()}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Date Picker Dropdown Popover */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-pink-100 p-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-pink-50 mb-3">
                  <span className="text-xs font-black text-gray-800">Pilih Periode Dashboard</span>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Year Selector */}
                <div className="flex items-center justify-between mb-3 bg-pink-50/60 p-1.5 rounded-2xl">
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`text-xs font-bold py-1 px-3 rounded-xl transition-all ${selectedYear === y
                          ? 'bg-[#f05080] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {MONTH_NAMES.map((name, idx) => {
                    const mNum = idx + 1
                    const isCurrent = selectedYear === parseInt(period.split('-')[0]) && mNum === parseInt(period.split('-')[1])
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedMonth(mNum)
                          handleApplyDate(selectedYear, mNum)
                        }}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl text-center transition-all ${isCurrent
                            ? 'bg-[#f05080] text-white font-bold shadow-sm'
                            : 'hover:bg-pink-50 text-gray-700'
                          }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-pink-50 space-y-1">
                  <button
                    onClick={() => handleApplyDate(2026, 9)}
                    className="w-full text-left text-[11px] font-semibold text-[#f05080] hover:bg-pink-50 py-1.5 px-2.5 rounded-xl flex items-center justify-between"
                  >
                    <span>🌸 September 2026 (Data Prototype)</span>
                    {period === '2026-09' && <Check size={12} />}
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date()
                      handleApplyDate(now.getFullYear(), now.getMonth() + 1)
                    }}
                    className="w-full text-left text-[11px] font-semibold text-gray-600 hover:bg-pink-50 py-1.5 px-2.5 rounded-xl flex items-center justify-between"
                  >
                    <span>📅 Bulan Berjalan (Hari Ini)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/transaksi')}
            className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>+ Catat Transaksi</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" text="Memuat pembukuan UMKM..." />
        </div>
      ) : (
        <>
          {/* Welcome & Zero-State Banner for new accounts or empty months */}
          {recentTx.length === 0 && (
            <div className="bg-gradient-to-r from-pink-50 via-white to-pink-50 rounded-2xl p-5 border border-pink-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#f05080] text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                  🏪
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">
                    Dashboard Keuangan: {businessName}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Halo <strong className="text-[#f05080]">{ownerName}</strong>, belum ada data transaksi pada periode <span className="font-semibold text-gray-800">{getDisplayPeriod()}</span>. Catat aktivitas keuangan baru Anda atau isi contoh data simulasi khusus usaha ini.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/transaksi')}
                  className="px-4 py-2 bg-[#f05080] hover:bg-[#e03f70] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Catat Transaksi Baru
                </button>
                <button
                  onClick={handleSeedCustomData}
                  disabled={seeding}
                  className="px-4 py-2 bg-white hover:bg-pink-50 border border-pink-200 text-[#f05080] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Isi contoh transaksi otomatis untuk usaha ini"
                >
                  {seeding ? <RefreshCw size={14} className="animate-spin" /> : <span>✨</span>}
                  <span>{seeding ? 'Memuat...' : `Isi Contoh Data Usaha`}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4 Summary Cards (Exact Prototype Layout) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Pemasukan */}
            <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Pemasukan</p>
              <p className="text-lg lg:text-xl font-extrabold text-gray-900 leading-tight">
                {formatRupiah(summary.income)}
              </p>
              <p className="text-xs font-semibold text-[#f05080] mt-2 flex items-center gap-1">
                <ArrowUpRight size={13} /> +12% dari Agustus
              </p>
            </div>

            {/* Card 2: Pengeluaran */}
            <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Pengeluaran</p>
              <p className="text-lg lg:text-xl font-extrabold text-gray-900 leading-tight">
                {formatRupiah(summary.expense)}
              </p>
              <p className="text-xs font-semibold text-[#f05080] mt-2 flex items-center gap-1">
                <ArrowUpRight size={13} /> +5% dari Agustus
              </p>
            </div>

            {/* Card 3: Laba Bersih */}
            <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Laba Bersih</p>
              <p className="text-lg lg:text-xl font-extrabold text-gray-900 leading-tight">
                {formatRupiah(summary.profit)}
              </p>
              <p className="text-xs font-semibold text-[#f05080] mt-2">
                Margin {summary.margin}%
              </p>
            </div>

            {/* Card 4: Saldo Kas */}
            <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Saldo Kas</p>
              <p className="text-lg lg:text-xl font-extrabold text-gray-900 leading-tight">
                {formatRupiah(summary.balance)}
              </p>
              <p className="text-xs font-semibold text-[#f05080] mt-2">
                Per 30 {MONTH_NAMES[parseInt(period.split('-')[1]) - 1]}
              </p>
            </div>
          </div>

          {/* Middle Row: Two Charts (Exact Prototype) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart Left (7 cols): Pemasukan vs Pengeluaran */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Pemasukan vs Pengeluaran</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Per minggu (juta rupiah)</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#f05080]"></span>
                    <span className="text-gray-600">Masuk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-[#1e1e1e]"></span>
                    <span className="text-gray-600">Keluar</span>
                  </div>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={6} barCategoryGap="25%">
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(val) => `Rp ${val} Juta`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #fce7f3', fontSize: 12 }}
                    />
                    <Bar
                      dataKey="Masuk"
                      fill="#f05080"
                      radius={[4, 4, 0, 0]}
                      label={{ position: 'top', fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="Keluar"
                      fill="#1e1e1e"
                      radius={[4, 4, 0, 0]}
                      label={{ position: 'top', fill: '#4b5563', fontSize: 10, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Right (5 cols): Komposisi Pengeluaran */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-3">Komposisi Pengeluaran</h3>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
                  {/* Donut with center text */}
                  <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData.length > 0 ? pieData : [{ name: 'Nol', value: 1, color: '#f3f4f6' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm font-extrabold text-gray-900 leading-tight">
                        {summary.expense >= 1000000 ? `Rp ${(summary.expense / 1000000).toFixed(1)} jt` : formatRupiah(summary.expense)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">total</span>
                    </div>
                  </div>

                  {/* Legend matching prototype */}
                  <div className="space-y-2.5 w-full sm:w-auto text-xs flex-1">
                    {pieData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }}></span>
                          <span className="text-gray-700 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-pink-50 text-[11px] text-gray-400 text-right">
                Berdasarkan {recentTx.length} transaksi pada {getDisplayPeriod()}
              </div>
            </div>
          </div>

          {/* Bottom Card: Transaksi Terbaru (Exact Prototype Table) */}
          <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Transaksi Terbaru</h3>
              <button
                onClick={() => navigate('/laporan')}
                className="bg-[#f05080] hover:bg-[#e03f70] text-white rounded-full px-5 py-1.5 text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Unduh Laporan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-pink-100/70 text-[#f05080] font-bold">
                    <th className="text-left py-2.5 px-3">Tanggal</th>
                    <th className="text-left py-2.5 px-3">Keterangan</th>
                    <th className="text-left py-2.5 px-3">Kategori</th>
                    <th className="text-right py-2.5 px-3">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        Tidak ada transaksi pada periode {getDisplayPeriod()}
                      </td>
                    </tr>
                  ) : (
                    recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-pink-50/40 transition-colors">
                        <td className="py-3 px-3 text-gray-500 font-medium">
                          {formatDateShort(tx.date)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800">
                          {tx.description || tx.category}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {tx.category}
                        </td>
                        <td className={`py-3 px-3 text-right font-bold ${tx.type === 'income' ? 'text-[#f05080]' : 'text-gray-900'
                          }`}>
                          {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
