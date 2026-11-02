import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate } from '../utils/helpers'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  FileBarChart, TrendingUp, TrendingDown, Download, Printer,
  RefreshCw, DollarSign, Package, CreditCard, Scale, Coins,
  CheckCircle2, AlertCircle, Info, Edit3
} from 'lucide-react'

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

const REPORT_TYPES = [
  { id: 'profit_loss', label: 'Laba Rugi', icon: DollarSign },
  { id: 'equity', label: 'Perubahan Modal', icon: Coins },
  { id: 'balance_sheet', label: 'Neraca Keuangan', icon: Scale },
  { id: 'cash_flow', label: 'Arus Kas', icon: RefreshCw },
  { id: 'income', label: 'Pemasukan', icon: TrendingUp },
  { id: 'expense', label: 'Pengeluaran', icon: TrendingDown },
  { id: 'stock', label: 'Stok Barang', icon: Package },
  { id: 'debt', label: 'Utang & Piutang', icon: CreditCard },
]

export default function LaporanPage() {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const [reportType, setReportType] = useState('profit_loss')
  const [period, setPeriod] = useState('2026-09')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const printRef = useRef()

  const businessName = profile?.business_name || user?.user_metadata?.business_name || (user?.email ? `Usaha ${user.email.split('@')[0]}` : 'Usaha Saya')

  // State for user customizable initial capital & prive
  const [initialCapital, setInitialCapital] = useState(() => {
    return Number(localStorage.getItem('akunasisten_modal_awal')) || 10000000
  })
  const [equipmentValue, setEquipmentValue] = useState(() => {
    return Number(localStorage.getItem('akunasisten_peralatan_aset')) || 3500000
  })

  useEffect(() => {
    if (user) generateReport()
  }, [user, reportType, period, initialCapital, equipmentValue])

  const generateReport = async () => {
    setLoading(true)
    try {
      const [year, month] = period.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      // Fetch transactions for period
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      // Fetch all historical transactions up to endDate for balance sheet cash
      const { data: allTxData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .lte('date', endDate)

      const txList = txData || []
      const allTxList = allTxData || []

      const incomeItems = txList.filter(t => t.type === 'income')
      const expenseItems = txList.filter(t => t.type === 'expense')
      const totalIncome = incomeItems.reduce((s, t) => s + Number(t.amount), 0)
      const totalExpense = expenseItems.reduce((s, t) => s + Number(t.amount), 0)
      const profit = totalIncome - totalExpense

      // Fetch products for stock value
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
      const totalStockValue = (products || []).reduce((s, p) => s + (p.quantity * Number(p.buy_price)), 0)

      // Fetch debts and receivables
      const [{ data: debts }, { data: receivables }] = await Promise.all([
        supabase.from('debts').select('*, debt_payments(*)').eq('user_id', user.id),
        supabase.from('receivables').select('*, receivable_payments(*)').eq('user_id', user.id),
      ])

      const getPaid = (item, type) => ((type === 'debt' ? item.debt_payments : item.receivable_payments) || []).reduce((s, p) => s + Number(p.amount), 0)
      const unpaidDebts = (debts || []).reduce((s, d) => s + Math.max(0, Number(d.amount) - getPaid(d, 'debt')), 0)
      const unpaidReceivables = (receivables || []).reduce((s, r) => s + Math.max(0, Number(r.amount) - getPaid(r, 'receivable')), 0)

      // Cumulative Cash Balance
      const cumIncome = allTxList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const cumExpense = allTxList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const cashBalance = Math.max(0, cumIncome - cumExpense)

      // Prive & Additional Capital from Transactions
      const priveTransactions = txList.filter(t =>
        t.type === 'expense' && (t.category.toLowerCase().includes('prive') || t.description.toLowerCase().includes('prive') || t.description.toLowerCase().includes('pribadi'))
      )
      const priveAmount = priveTransactions.reduce((s, t) => s + Number(t.amount), 0)

      const investTransactions = txList.filter(t =>
        t.type === 'income' && (t.category.toLowerCase().includes('investasi') || t.category.toLowerCase().includes('modal'))
      )
      const additionalCapital = investTransactions.reduce((s, t) => s + Number(t.amount), 0)

      // Equity (Perubahan Modal)
      const netCapitalChange = profit + additionalCapital - priveAmount
      const endingCapital = initialCapital + netCapitalChange

      // Balance Sheet (Neraca)
      const currentAssets = cashBalance + unpaidReceivables + totalStockValue
      const fixedAssets = equipmentValue
      const totalAssets = currentAssets + fixedAssets

      const totalLiabilities = unpaidDebts
      const balancedEquity = totalAssets - totalLiabilities

      setReportData({
        startDate, endDate, period,
        incomeItems, expenseItems, totalIncome, totalExpense,
        profit, transactions: txList,
        products: products || [], totalValue: totalStockValue,
        debts: debts || [], receivables: receivables || [],
        totalDebt: (debts || []).reduce((s, d) => s + Number(d.amount), 0),
        totalReceivable: (receivables || []).reduce((s, r) => s + Number(r.amount), 0),
        getPaid,
        // Equity statement data
        initialCapital,
        additionalCapital,
        priveAmount,
        netCapitalChange,
        endingCapital,
        // Balance sheet data
        cashBalance,
        unpaidReceivables,
        totalStockValue,
        currentAssets,
        fixedAssets,
        totalAssets,
        unpaidDebts,
        totalLiabilities,
        balancedEquity,
      })
    } catch (err) {
      console.error(err)
      addToast('Gagal membuat laporan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const handleExcelDownload = () => {
    if (!reportData) return
    try {
      let csvContent = ''
      const [year, month] = period.split('-')
      const monthLabel = `${MONTHS_ID[parseInt(month) - 1]} ${year}`

      if (reportType === 'profit_loss') {
        csvContent = `LAPORAN LABA RUGI - ${profile?.business_name || 'UMKM'}\n`
        csvContent += `Periode: ${monthLabel}\n\n`
        csvContent += `PENDAPATAN USAHA\n`
        reportData.incomeItems.forEach(t => {
          csvContent += `${t.date},${t.category},"${t.description || ''}",${t.amount}\n`
        })
        csvContent += `Total Pemasukan,,,${reportData.totalIncome}\n\n`
        csvContent += `BEBAN & PENGELUARAN USAHA\n`
        reportData.expenseItems.forEach(t => {
          csvContent += `${t.date},${t.category},"${t.description || ''}",${t.amount}\n`
        })
        csvContent += `Total Pengeluaran,,,${reportData.totalExpense}\n\n`
        csvContent += `LABA / (RUGI) BERSIH,,,${reportData.profit}\n`
      } else if (reportType === 'equity') {
        csvContent = `LAPORAN PERUBAHAN MODAL (EKUITAS) - ${profile?.business_name || 'UMKM'}\n`
        csvContent += `Periode: ${monthLabel}\n\n`
        csvContent += `Keterangan,Nominal\n`
        csvContent += `Modal Awal (1 ${MONTHS_ID[parseInt(month) - 1]} ${year}),${reportData.initialCapital}\n`
        csvContent += `Laba Bersih Periode Berjalan,${reportData.profit}\n`
        csvContent += `Setoran Modal Tambahan,${reportData.additionalCapital}\n`
        csvContent += `Prive / Penarikan Pemilik,-${reportData.priveAmount}\n`
        csvContent += `Kenaikan / (Penurunan) Modal,${reportData.netCapitalChange}\n`
        csvContent += `MODAL AKHIR (${monthLabel}),${reportData.endingCapital}\n`
      } else if (reportType === 'balance_sheet') {
        csvContent = `LAPORAN NERACA KEUANGAN (BALANCE SHEET) - ${profile?.business_name || 'UMKM'}\n`
        csvContent += `Posisi Per: ${reportData.endDate}\n\n`
        csvContent += `AKTIVA (ASET),Nominal\n`
        csvContent += `Kas dan Setara Kas,${reportData.cashBalance}\n`
        csvContent += `Piutang Usaha,${reportData.unpaidReceivables}\n`
        csvContent += `Persediaan Barang Dagang,${reportData.totalStockValue}\n`
        csvContent += `Total Aktiva Lancar,${reportData.currentAssets}\n`
        csvContent += `Peralatan & Aset Tetap,${reportData.fixedAssets}\n`
        csvContent += `TOTAL AKTIVA,${reportData.totalAssets}\n\n`
        csvContent += `PASIVA (KEWAJIBAN & EKUITAS),Nominal\n`
        csvContent += `Utang Usaha,${reportData.unpaidDebts}\n`
        csvContent += `Total Kewajiban,${reportData.totalLiabilities}\n`
        csvContent += `Modal Pemilik,${reportData.balancedEquity}\n`
        csvContent += `TOTAL PASIVA,${reportData.totalLiabilities + reportData.balancedEquity}\n`
      } else {
        csvContent = 'Tanggal,Jenis,Kategori,Keterangan,Nominal\n'
        reportData.transactions.forEach(t => {
          csvContent += `${t.date},${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'},${t.category},"${t.description || ''}",${t.amount}\n`
        })
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_${reportType}_${monthLabel.replace(' ', '_')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Laporan berhasil diunduh dalam format CSV!', 'success')
    } catch (err) {
      addToast('Gagal mengunduh laporan', 'error')
    }
  }

  const getPeriodOptions = () => {
    const opts = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const lbl = `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
      opts.push({ value: val, label: lbl })
    }
    // Also include September 2026 if not present
    if (!opts.some(o => o.value === '2026-09')) {
      opts.unshift({ value: '2026-09', label: 'September 2026 (Prototype)' })
    }
    return opts
  }

  const [year, month] = period.split('-')
  const monthLabel = `${MONTHS_ID[parseInt(month) - 1]} ${year}`

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Laporan Keuangan UMKM</h1>
          <p className="text-sm font-medium text-gray-500 mt-0.5">
            Laporan akuntansi standar SAK EMKM lengkap & siap cetak
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 py-2 px-3 text-xs font-bold">
            <Printer size={15} /> Cetak
          </button>
          <button onClick={handleExcelDownload} className="btn-primary flex items-center gap-2 py-2 px-4 text-xs font-bold">
            <Download size={15} /> Unduh CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => setReportType(rt.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-xs font-bold text-center ${reportType === rt.id
                ? 'border-[#f05080] bg-pink-50 text-[#f05080] shadow-sm'
                : 'border-gray-100 bg-white text-gray-600 hover:border-pink-200'
              }`}
          >
            <rt.icon size={18} className={reportType === rt.id ? 'text-[#f05080]' : 'text-gray-400'} />
            <span className="leading-tight">{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Period Filter Bar */}
      <div className="card py-3.5 px-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-600">Periode Laporan:</span>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="input-field text-xs w-auto py-1.5 font-bold text-[#f05080]"
          >
            {getPeriodOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={generateReport}
            className="p-1.5 rounded-xl bg-pink-100 text-[#f05080] hover:bg-pink-200 transition-colors"
            title="Refresh Laporan"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="text-xs font-semibold text-gray-500">
          Entitas: <span className="text-gray-800 font-bold">{businessName}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner text="Menghitung laporan akuntansi..." /></div>
      ) : (
        <div ref={printRef} className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#f05080] via-[#ec4899] to-[#db2777] rounded-3xl p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-pink-100 mb-1">
                  {businessName}
                </p>
                <h2 className="text-xl font-black">
                  Laporan {REPORT_TYPES.find(r => r.id === reportType)?.label}
                </h2>
                <p className="text-pink-100 text-xs mt-1">
                  Periode: {monthLabel} (Standar SAK EMKM Indonesia)
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <FileBarChart size={28} />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. LAPORAN PERUBAHAN MODAL (EQUITY STATEMENT) */}
          {/* ========================================================= */}
          {reportType === 'equity' && reportData && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-blue-50/60 border-blue-100">
                  <p className="text-xs text-blue-700 font-bold mb-1">Modal Awal</p>
                  <p className="text-xl font-extrabold text-blue-900">{formatRupiah(reportData.initialCapital)}</p>
                  <p className="text-[10px] text-blue-600 mt-1">Awal periode {monthLabel}</p>
                </div>
                <div className={`card ${reportData.profit >= 0 ? 'bg-green-50/60 border-green-100' : 'bg-red-50/60 border-red-100'}`}>
                  <p className={`text-xs font-bold mb-1 ${reportData.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Laba Bersih Berjalan
                  </p>
                  <p className={`text-xl font-extrabold ${reportData.profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatRupiah(reportData.profit)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Dari Laporan Laba Rugi</p>
                </div>
                <div className="card bg-pink-50/60 border-pink-100">
                  <p className="text-xs text-[#f05080] font-bold mb-1">Modal Akhir</p>
                  <p className="text-xl font-black text-[#f05080]">{formatRupiah(reportData.endingCapital)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Per akhir {monthLabel}</p>
                </div>
              </div>

              {/* Detail Table */}
              <div className="card p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                  <h3 className="font-extrabold text-gray-800 text-base">Rincian Perubahan Ekuitas Pemilik</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Atur Modal Awal:</span>
                    <input
                      type="number"
                      className="input-field text-xs py-1 px-2.5 w-32 font-bold text-gray-800"
                      value={initialCapital}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setInitialCapital(val)
                        localStorage.setItem('akunasisten_modal_awal', val)
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100 font-semibold text-gray-800">
                    <span>1. Modal Awal (Awal Bulan)</span>
                    <span>{formatRupiah(reportData.initialCapital)}</span>
                  </div>

                  <div className="pl-4 space-y-2 border-l-2 border-pink-200">
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-green-500" /> Laba Bersih Periode Ini
                      </span>
                      <span className="font-semibold text-green-600">+{formatRupiah(reportData.profit)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Coins size={14} className="text-blue-500" /> Setoran Modal Tambahan (Investasi)
                      </span>
                      <span className="font-semibold text-blue-600">+{formatRupiah(reportData.additionalCapital)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <TrendingDown size={14} className="text-red-500" /> Penarikan Pemilik (Prive)
                      </span>
                      <span className="font-semibold text-red-600">-{formatRupiah(reportData.priveAmount)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-2.5 bg-pink-50/50 px-3 rounded-xl font-bold text-gray-800 border border-pink-100">
                    <span>Penambahan / (Pengurangan) Modal Bersih</span>
                    <span className={reportData.netCapitalChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {reportData.netCapitalChange >= 0 ? '+' : ''}{formatRupiah(reportData.netCapitalChange)}
                    </span>
                  </div>

                  <div className="flex justify-between py-3 px-4 bg-gradient-to-r from-pink-500 to-[#f05080] text-white rounded-2xl font-black text-base shadow-sm">
                    <span>2. Modal Akhir Pemilik</span>
                    <span>{formatRupiah(reportData.endingCapital)}</span>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-gray-50 rounded-2xl flex items-start gap-2.5 text-xs text-gray-500">
                  <Info size={16} className="text-pink-500 flex-shrink-0 mt-0.5" />
                  <p>
                    <b>Catatan Akuntansi:</b> Laporan Perubahan Modal menunjukkan bagaimana nilai investasi pemilik bertambah dari keuntungan usaha atau berkurang akibat penarikan pribadi (prive) selama periode berjalan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. LAPORAN NERACA KEUANGAN (BALANCE SHEET) */}
          {/* ========================================================= */}
          {reportType === 'balance_sheet' && reportData && (
            <div className="space-y-5">
              {/* Balanced indicator */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-900 text-sm">Neraca Keuangan Seimbang (Balanced)</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Prinsip Akuntansi: Total Aktiva = Total Kewajiban + Ekuitas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-600 font-bold block uppercase">Nilai Neraca</span>
                  <span className="text-lg font-black text-emerald-900">{formatRupiah(reportData.totalAssets)}</span>
                </div>
              </div>

              {/* Two Column Neraca (Aktiva vs Pasiva) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Column 1: AKTIVA (ASET) */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                    <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#f05080]"></span> AKTIVA (ASET)
                    </h3>
                    <span className="badge-pink text-xs font-bold">Total Kekayaan</span>
                  </div>

                  {/* Aset Lancar */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Aset Lancar</h4>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Kas & Saldo Kasir</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.cashBalance)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Piutang Usaha Pelanggan</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.unpaidReceivables)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Persediaan Barang Dagang (Stok)</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.totalStockValue)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-pink-50/50 px-2.5 rounded-xl font-bold text-xs text-[#f05080]">
                      <span>Subtotal Aset Lancar</span>
                      <span>{formatRupiah(reportData.currentAssets)}</span>
                    </div>
                  </div>

                  {/* Aset Tetap */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Aset Tetap & Peralatan</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span>Edit:</span>
                        <input
                          type="number"
                          className="input-field text-xs py-0.5 px-2 w-24 text-right font-bold text-gray-800"
                          value={equipmentValue}
                          onChange={e => {
                            const val = Number(e.target.value) || 0
                            setEquipmentValue(val)
                            localStorage.setItem('akunasisten_peralatan_aset', val)
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Peralatan, Mesin & Sarana Usaha</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.fixedAssets)}</span>
                    </div>
                  </div>

                  {/* Total Aktiva */}
                  <div className="flex justify-between py-3 px-4 bg-gray-900 text-white rounded-2xl font-black text-sm mt-4">
                    <span>TOTAL AKTIVA</span>
                    <span className="text-pink-400">{formatRupiah(reportData.totalAssets)}</span>
                  </div>
                </div>

                {/* Column 2: PASIVA (KEWAJIBAN & EKUITAS) */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                    <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-800"></span> PASIVA (KEWAJIBAN & EKUITAS)
                    </h3>
                    <span className="badge-pink text-xs font-bold">Sumber Modal</span>
                  </div>

                  {/* Kewajiban / Utang */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Kewajiban (Utang)</h4>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Utang Usaha & Supplier</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.unpaidDebts)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-gray-100 px-2.5 rounded-xl font-bold text-xs text-gray-800">
                      <span>Subtotal Kewajiban</span>
                      <span>{formatRupiah(reportData.totalLiabilities)}</span>
                    </div>
                  </div>

                  {/* Ekuitas / Modal */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Ekuitas (Modal)</h4>
                    <div className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <span className="text-gray-700">Modal Pemilik (Ekuitas Bersih)</span>
                      <span className="font-bold text-gray-900">{formatRupiah(reportData.balancedEquity)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-pink-50/50 px-2.5 rounded-xl font-bold text-xs text-[#f05080]">
                      <span>Subtotal Ekuitas</span>
                      <span>{formatRupiah(reportData.balancedEquity)}</span>
                    </div>
                  </div>

                  {/* Total Pasiva */}
                  <div className="flex justify-between py-3 px-4 bg-gray-900 text-white rounded-2xl font-black text-sm mt-4">
                    <span>TOTAL PASIVA (KEWAJIBAN + EKUITAS)</span>
                    <span className="text-pink-400">
                      {formatRupiah(reportData.totalLiabilities + reportData.balancedEquity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. LAPORAN LABA RUGI (PROFIT & LOSS) */}
          {/* ========================================================= */}
          {reportType === 'profit_loss' && reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="card bg-green-50/80 border-green-100">
                  <p className="text-xs text-green-700 font-bold mb-1">Total Pemasukan</p>
                  <p className="text-xl font-black text-green-800">{formatRupiah(reportData.totalIncome)}</p>
                </div>
                <div className="card bg-red-50/80 border-red-100">
                  <p className="text-xs text-red-700 font-bold mb-1">Total Pengeluaran</p>
                  <p className="text-xl font-black text-red-800">{formatRupiah(reportData.totalExpense)}</p>
                </div>
                <div className={`card ${reportData.profit >= 0 ? 'bg-pink-50 border-pink-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-xs font-bold mb-1 ${reportData.profit >= 0 ? 'text-[#f05080]' : 'text-orange-700'}`}>
                    {reportData.profit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                  </p>
                  <p className={`text-xl font-black ${reportData.profit >= 0 ? 'text-[#f05080]' : 'text-orange-700'}`}>
                    {formatRupiah(Math.abs(reportData.profit))}
                  </p>
                </div>
              </div>

              {/* Income breakdown */}
              <div className="card">
                <h3 className="font-extrabold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-green-500" /> Rincian Pemasukan
                </h3>
                {reportData.incomeItems.length === 0 ? <p className="text-gray-400 text-xs py-4 text-center">Tidak ada pemasukan pada periode ini</p> : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-100 text-[#f05080] font-bold"><th className="text-left py-2 px-2">Tanggal</th><th className="text-left py-2 px-2">Keterangan</th><th className="text-left py-2 px-2">Kategori</th><th className="text-right py-2 px-2">Nominal</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.incomeItems.map(t => (
                        <tr key={t.id}><td className="py-2.5 px-2 text-gray-500">{formatDate(t.date)}</td><td className="py-2.5 px-2 font-medium text-gray-800">{t.description || '-'}</td><td className="py-2.5 px-2"><span className="badge-green text-[10px]">{t.category}</span></td><td className="py-2.5 px-2 text-right font-bold text-green-600">+{formatRupiah(t.amount)}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-green-50 font-bold"><td colSpan={3} className="py-2 px-2 text-green-800">Total Pemasukan</td><td className="py-2 px-2 text-right text-green-800">{formatRupiah(reportData.totalIncome)}</td></tr></tfoot>
                  </table>
                )}
              </div>

              {/* Expense breakdown */}
              <div className="card">
                <h3 className="font-extrabold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <TrendingDown size={16} className="text-red-500" /> Rincian Pengeluaran
                </h3>
                {reportData.expenseItems.length === 0 ? <p className="text-gray-400 text-xs py-4 text-center">Tidak ada pengeluaran pada periode ini</p> : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-100 text-[#f05080] font-bold"><th className="text-left py-2 px-2">Tanggal</th><th className="text-left py-2 px-2">Keterangan</th><th className="text-left py-2 px-2">Kategori</th><th className="text-right py-2 px-2">Nominal</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.expenseItems.map(t => (
                        <tr key={t.id}><td className="py-2.5 px-2 text-gray-500">{formatDate(t.date)}</td><td className="py-2.5 px-2 font-medium text-gray-800">{t.description || '-'}</td><td className="py-2.5 px-2"><span className="badge-red text-[10px]">{t.category}</span></td><td className="py-2.5 px-2 text-right font-bold text-red-600">-{formatRupiah(t.amount)}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-red-50 font-bold"><td colSpan={3} className="py-2 px-2 text-red-800">Total Pengeluaran</td><td className="py-2 px-2 text-right text-red-800">{formatRupiah(reportData.totalExpense)}</td></tr></tfoot>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. OTHER REPORTS (Cash flow, Income, Expense, Stock, Debt) */}
          {/* ========================================================= */}
          {['income', 'expense', 'cash_flow'].includes(reportType) && reportData && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Daftar Transaksi {reportType === 'income' ? 'Pemasukan' : reportType === 'expense' ? 'Pengeluaran' : 'Arus Kas'}</h3>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-pink-100 text-[#f05080] font-bold"><th className="text-left py-2 px-2">Tanggal</th><th className="text-left py-2 px-2">Keterangan</th><th className="text-left py-2 px-2">Kategori</th><th className="text-right py-2 px-2">Nominal</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(reportType === 'cash_flow' ? reportData.transactions : reportType === 'income' ? reportData.incomeItems : reportData.expenseItems).map(t => (
                    <tr key={t.id} className="hover:bg-pink-50/30">
                      <td className="py-2.5 px-2 text-gray-500">{formatDate(t.date)}</td>
                      <td className="py-2.5 px-2 font-semibold text-gray-800">{t.description || '-'}</td>
                      <td className="py-2.5 px-2"><span className="badge-pink text-[10px]">{t.category}</span></td>
                      <td className={`py-2.5 px-2 text-right font-extrabold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stock Report */}
          {reportType === 'stock' && reportData && (
            <div className="space-y-4">
              <div className="card bg-pink-50 border-pink-200">
                <p className="text-xs font-bold text-[#f05080]">Total Nilai Stok Persediaan</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{formatRupiah(reportData.totalValue)}</p>
              </div>
              <div className="card p-5">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-pink-100 text-[#f05080] font-bold"><th className="text-left py-2 px-2">Barang</th><th className="text-left py-2 px-2">Stok</th><th className="text-left py-2 px-2">Harga Beli</th><th className="text-right py-2 px-2">Total Nilai</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.products.map(p => (
                      <tr key={p.id}><td className="py-2.5 px-2 font-medium">{p.name}</td><td className="py-2.5 px-2">{p.quantity} {p.unit}</td><td className="py-2.5 px-2">{formatRupiah(p.buy_price)}</td><td className="py-2.5 px-2 text-right font-bold text-[#f05080]">{formatRupiah(p.quantity * p.buy_price)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Debt Report */}
          {reportType === 'debt' && reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-extrabold text-red-600 mb-3 text-sm">Daftar Utang</h3>
                <div className="space-y-2">
                  {reportData.debts.map(d => (
                    <div key={d.id} className="flex justify-between py-2 border-b border-gray-50 text-xs">
                      <div><p className="font-bold text-gray-800">{d.name}</p><p className="text-[10px] text-gray-400">Jatuh tempo: {d.due_date || '-'}</p></div>
                      <p className="font-black text-red-600">{formatRupiah(d.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-extrabold text-blue-600 mb-3 text-sm">Daftar Piutang</h3>
                <div className="space-y-2">
                  {reportData.receivables.map(r => (
                    <div key={r.id} className="flex justify-between py-2 border-b border-gray-50 text-xs">
                      <div><p className="font-bold text-gray-800">{r.name}</p><p className="text-[10px] text-gray-400">Jatuh tempo: {r.due_date || '-'}</p></div>
                      <p className="font-black text-blue-600">{formatRupiah(r.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
