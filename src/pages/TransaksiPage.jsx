import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  Plus, Search, Edit2, Trash2, Eye, TrendingUp, TrendingDown,
  Upload, X, Camera, ArrowRight, CheckCircle2, FileText
} from 'lucide-react'

const INCOME_CATEGORIES = ['Penjualan harian', 'Pesanan katering', 'Jasa', 'Piutang Cair', 'Lainnya']
const EXPENSE_CATEGORIES = ['Bahan baku', 'Gaji', 'Operasional', 'Transport', 'Sewa', 'Perlengkapan', 'Lainnya']

export default function TransaksiPage() {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const ownerName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Pemilik Usaha')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDetail, setShowDetail] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Direct form matching Prototype Smartphone view
  const [form, setForm] = useState({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Penjualan harian',
    description: '',
    receipt_url: '',
  })

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      addToast('Gagal memuat transaksi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const ext = file.name.split('.').pop()
      const filename = `receipts/${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('uploads').upload(filename, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filename)
      setForm(f => ({ ...f, receipt_url: publicUrl }))
      addToast('Foto nota berhasil diunggah', 'success')
    } catch (err) {
      addToast('Gagal mengunggah foto', 'error')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      addToast('Nominal transaksi wajib diisi!', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        type: form.type,
        date: form.date || new Date().toISOString().split('T')[0],
        amount: Number(form.amount),
        category: form.category || (form.type === 'income' ? 'Penjualan harian' : 'Bahan baku'),
        description: form.description || (form.type === 'income' ? 'Penjualan harian' : 'Pengeluaran operasional'),
        receipt_url: form.receipt_url || '',
      }

      if (editItem) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', editItem.id)
        if (error) throw error
        addToast('Transaksi berhasil diperbarui!', 'success')
        setEditItem(null)
      } else {
        const { error } = await supabase.from('transactions').insert([payload])
        if (error) throw error
        addToast('Transaksi berhasil disimpan ke pembukuan!', 'success')
      }

      // Reset form
      setForm({
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Penjualan harian',
        description: '',
        receipt_url: '',
      })

      fetchTransactions()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (tx) => {
    setEditItem(tx)
    setForm({
      type: tx.type,
      date: tx.date,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description || '',
      receipt_url: tx.receipt_url || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', deleteId)
      if (error) throw error
      addToast('Transaksi berhasil dihapus!', 'success')
      setDeleteId(null)
      fetchTransactions()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const filtered = transactions.filter(tx => {
    const matchSearch = (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || tx.type === filterType
    const matchCat = filterCategory === 'all' || tx.category === filterCategory
    return matchSearch && matchType && matchCat
  })

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const activeCategories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Catat Transaksi Keuangan</h1>
          <p className="text-sm font-medium text-gray-500 mt-0.5">
            Pencatatan pemasukan & pengeluaran usaha digital
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-pink-100 rounded-2xl px-4 py-2 text-right shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Masuk</span>
            <span className="text-sm font-extrabold text-[#f05080]">{formatRupiah(totalIncome)}</span>
          </div>
          <div className="bg-white border border-pink-100 rounded-2xl px-4 py-2 text-right shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Keluar</span>
            <span className="text-sm font-extrabold text-gray-900">{formatRupiah(totalExpense)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card (Matches EXACT Prototype Smartphone Mockup) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-pink-100 shadow-md relative overflow-hidden">
          {/* Header Pink Gradient Banner */}
          <div className="bg-gradient-to-r from-[#f05080] to-[#ec4899] -mx-6 -mt-6 p-6 text-white mb-6">
            <p className="text-xs font-semibold text-pink-100">
              Halo, {ownerName}!
            </p>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-xl font-black tracking-tight">
                {editItem ? 'Edit Transaksi' : 'Catat Transaksi'}
              </h2>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                +
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Pill Switch (Pemasukan vs Pengeluaran) */}
            <div className="grid grid-cols-2 gap-2 bg-pink-50 p-1 rounded-2xl border border-pink-100">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'income', category: 'Penjualan harian' }))}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all ${form.type === 'income'
                  ? 'bg-[#f05080] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#f05080]'
                  }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, type: 'expense', category: 'Bahan baku' }))}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all ${form.type === 'expense'
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Pengeluaran
              </button>
            </div>

            {/* Nominal Field (Large prototype input style) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nominal
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="1.250.000"
                  className="input-field pl-12 text-base font-extrabold text-gray-900 bg-pink-50/30"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                className="input-field text-xs text-gray-700"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>

            {/* Kategori Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Kategori
              </label>
              <select
                className="input-field text-xs text-gray-800 font-semibold"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
              >
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Catatan Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Catatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Omzet warung hari ini / Beli ayam"
                className="input-field text-xs text-gray-800"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Foto nota (opsional) - Prototype box */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Foto nota (opsional)
              </label>
              {form.receipt_url ? (
                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-2xl border border-pink-200">
                  <img src={form.receipt_url} alt="nota" className="w-12 h-12 object-cover rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">Foto nota tersimpan</p>
                    <p className="text-[10px] text-green-600 font-medium">✓ Siap dilampirkan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, receipt_url: '' }))}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-pink-200 hover:border-[#f05080] hover:bg-pink-50/50 cursor-pointer text-[#f05080] transition-all text-xs font-bold">
                  {uploadingFile ? (
                    <div className="w-4 h-4 border-2 border-[#f05080] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera size={16} />
                      <span>+ Unggah foto nota</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </label>
              )}
            </div>

            {/* SIMPAN TRANSAKSI button (Exact Prototype) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#f05080] hover:bg-[#e03f70] text-white py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{editItem ? 'Perbarui Transaksi' : 'SIMPAN TRANSAKSI'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              {editItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditItem(null)
                    setForm({
                      type: 'income',
                      date: new Date().toISOString().split('T')[0],
                      amount: '',
                      category: 'Penjualan harian',
                      description: '',
                      receipt_url: '',
                    })
                  }}
                  className="w-full mt-2 text-center text-xs font-semibold text-gray-400 hover:text-gray-600 py-1"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Transaction History & Filter Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  className="input-field pl-9 text-xs"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input-field text-xs w-auto font-medium"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner text="Memuat riwayat..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText size={36} className="mx-auto mb-2 text-pink-200" />
                <p className="text-xs font-medium">Belum ada transaksi yang sesuai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-pink-100 text-[#f05080] font-bold">
                      <th className="text-left py-2.5 px-3">Tanggal</th>
                      <th className="text-left py-2.5 px-3">Keterangan</th>
                      <th className="text-left py-2.5 px-3">Kategori</th>
                      <th className="text-right py-2.5 px-3">Nominal</th>
                      <th className="text-center py-2.5 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(tx => (
                      <tr key={tx.id} className="hover:bg-pink-50/40 transition-colors">
                        <td className="py-3 px-3 text-gray-500 font-medium whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800 max-w-[180px] truncate">
                          {tx.description || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'income' ? 'bg-pink-50 text-[#f05080]' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${tx.type === 'income' ? 'text-[#f05080]' : 'text-gray-900'
                          }`}>
                          {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setShowDetail(tx)}
                              className="p-1 text-gray-400 hover:text-blue-500"
                              title="Detail"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => startEdit(tx)}
                              className="p-1 text-gray-400 hover:text-[#f05080]"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detail Transaksi">
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl ${showDetail.type === 'income' ? 'bg-pink-50' : 'bg-gray-100'}`}>
              <p className="text-xs font-bold text-gray-500">Nominal</p>
              <p className={`text-2xl font-black mt-1 ${showDetail.type === 'income' ? 'text-[#f05080]' : 'text-gray-900'}`}>
                {showDetail.type === 'income' ? '+' : '-'} {formatRupiah(showDetail.amount)}
              </p>
            </div>
            {[
              { label: 'Jenis', value: showDetail.type === 'income' ? 'Pemasukan' : 'Pengeluaran' },
              { label: 'Tanggal', value: formatDate(showDetail.date) },
              { label: 'Kategori', value: showDetail.category },
              { label: 'Catatan', value: showDetail.description || '-' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-400">{item.label}</span>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
            {showDetail.receipt_url && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Lampiran Bukti / Nota</p>
                <img src={showDetail.receipt_url} alt="nota" className="w-full rounded-2xl object-cover max-h-64 border border-pink-100" />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini dari pembukuan?"
      />
    </div>
  )
}
