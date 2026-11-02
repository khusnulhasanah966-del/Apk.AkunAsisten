import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate, daysUntilDue } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Plus, Edit2, Trash2, CreditCard, AlertTriangle, CheckCircle, Clock, DollarSign, X } from 'lucide-react'

const initialDebtForm = { name: '', date: new Date().toISOString().split('T')[0], amount: '', due_date: '', description: '', status: 'unpaid' }
const initialPayForm = { amount: '', note: '', date: new Date().toISOString().split('T')[0] }

export default function UtangPiutangPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('utang')
  const [debts, setDebts] = useState([])
  const [receivables, setReceivables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [form, setForm] = useState(initialDebtForm)
  const [payForm, setPayForm] = useState(initialPayForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: dData }, { data: rData }] = await Promise.all([
        supabase.from('debts').select('*, debt_payments(*)').eq('user_id', user.id).order('due_date'),
        supabase.from('receivables').select('*, receivable_payments(*)').eq('user_id', user.id).order('due_date'),
      ])
      setDebts(dData || [])
      setReceivables(rData || [])
    } catch (err) { addToast('Gagal memuat data', 'error') }
    finally { setLoading(false) }
  }

  const getPaid = (item, type) => {
    const payments = type === 'debt' ? item.debt_payments : item.receivable_payments
    return (payments || []).reduce((s, p) => s + Number(p.amount), 0)
  }
  const getRemaining = (item, type) => Number(item.amount) - getPaid(item, type)
  const isOverdue = (item) => item.due_date && new Date(item.due_date) < new Date() && getRemaining(item, activeTab === 'utang' ? 'debt' : 'receivable') > 0

  const openAdd = () => { setEditItem(null); setForm(initialDebtForm); setShowModal(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, date: item.date, amount: String(item.amount), due_date: item.due_date || '', description: item.description || '', status: item.status })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const table = activeTab === 'utang' ? 'debts' : 'receivables'
    try {
      const payload = { user_id: user.id, name: form.name, date: form.date, amount: Number(form.amount), due_date: form.due_date || null, description: form.description, status: form.status }
      if (editItem) {
        await supabase.from(table).update(payload).eq('id', editItem.id)
        addToast(`${activeTab === 'utang' ? 'Utang' : 'Piutang'} berhasil diperbarui!`, 'success')
      } else {
        await supabase.from(table).insert([payload])
        addToast(`${activeTab === 'utang' ? 'Utang' : 'Piutang'} berhasil ditambahkan!`, 'success')
      }
      setShowModal(false)
      fetchData()
    } catch (err) { addToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    const table = activeTab === 'utang' ? 'debts' : 'receivables'
    try {
      await supabase.from(table).delete().eq('id', deleteItem)
      addToast('Data berhasil dihapus!', 'success')
      setDeleteItem(null)
      fetchData()
    } catch (err) { addToast(err.message, 'error') }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setSaving(true)
    const table = activeTab === 'utang' ? 'debt_payments' : 'receivable_payments'
    const fk = activeTab === 'utang' ? 'debt_id' : 'receivable_id'
    try {
      await supabase.from(table).insert([{ [fk]: showPayModal.id, amount: Number(payForm.amount), note: payForm.note, date: payForm.date, user_id: user.id }])
      const remaining = getRemaining(showPayModal, activeTab === 'utang' ? 'debt' : 'receivable') - Number(payForm.amount)
      if (remaining <= 0) {
        const t2 = activeTab === 'utang' ? 'debts' : 'receivables'
        await supabase.from(t2).update({ status: 'paid' }).eq('id', showPayModal.id)
      }
      addToast('Pembayaran berhasil dicatat!', 'success')
      setShowPayModal(null)
      setPayForm(initialPayForm)
      fetchData()
    } catch (err) { addToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const currentData = activeTab === 'utang' ? debts : receivables
  const type = activeTab === 'utang' ? 'debt' : 'receivable'
  const totalAmount = currentData.reduce((s, item) => s + Number(item.amount), 0)
  const totalPaid = currentData.reduce((s, item) => s + getPaid(item, type), 0)
  const totalRemaining = totalAmount - totalPaid

  const getDueLabel = (item) => {
    if (!item.due_date) return null
    const days = daysUntilDue(item.due_date)
    if (days < 0) return { label: `Lewat ${Math.abs(days)} hari`, color: 'text-red-500' }
    if (days === 0) return { label: 'Jatuh tempo hari ini!', color: 'text-red-500' }
    if (days <= 7) return { label: `${days} hari lagi`, color: 'text-yellow-600' }
    return { label: `${days} hari lagi`, color: 'text-gray-400' }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Utang & Piutang</h1>
          <p className="text-gray-500 text-sm">Kelola kewajiban dan tagihan usaha Anda</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tambah {activeTab === 'utang' ? 'Utang' : 'Piutang'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-pink-100 w-fit">
        {[{val:'utang',label:'💸 Utang'},{val:'piutang',label:'💰 Piutang'}].map(t => (
          <button key={t.val} onClick={() => setActiveTab(t.val)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.val ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-500 hover:text-pink-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Total {activeTab === 'utang' ? 'Utang' : 'Piutang'}</p>
          <p className="text-lg font-bold text-gray-800">{formatRupiah(totalAmount)}</p>
        </div>
        <div className="card bg-green-50 border-green-100">
          <p className="text-xs text-green-700 font-medium mb-1">Sudah Dibayar</p>
          <p className="text-lg font-bold text-green-700">{formatRupiah(totalPaid)}</p>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-xs text-red-700 font-medium mb-1">Sisa</p>
          <p className="text-lg font-bold text-red-700">{formatRupiah(totalRemaining)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner text="Memuat data..." /></div>
      ) : currentData.length === 0 ? (
        <EmptyState icon={CreditCard}
          title={`Belum ada ${activeTab === 'utang' ? 'utang' : 'piutang'}`}
          description={`Catat ${activeTab === 'utang' ? 'utang' : 'piutang'} usaha Anda di sini`}
          action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tambah</button>} />
      ) : (
        <div className="space-y-3">
          {currentData.map(item => {
            const paid = getPaid(item, type)
            const remaining = getRemaining(item, type)
            const progress = Math.min(100, (paid / Number(item.amount)) * 100)
            const dueLbl = getDueLabel(item)
            const isFullyPaid = item.status === 'paid' || remaining <= 0

            return (
              <div key={item.id} className={`card border-l-4 ${isFullyPaid ? 'border-l-green-400' : isOverdue(item) ? 'border-l-red-400' : 'border-l-pink-400'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isFullyPaid ? 'bg-green-100' : 'bg-pink-100'}`}>
                    {isFullyPaid ? <CheckCircle size={20} className="text-green-600" /> : <CreditCard size={20} className="text-pink-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.description || '-'}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!isFullyPaid && (
                          <button onClick={() => { setShowPayModal(item); setPayForm(initialPayForm) }} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500" title="Catat pembayaran">
                            <DollarSign size={15} />
                          </button>
                        )}
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="font-semibold text-gray-800">{formatRupiah(item.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Dibayar</p>
                        <p className="font-semibold text-green-600">{formatRupiah(paid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Sisa</p>
                        <p className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(remaining)}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${isFullyPaid ? 'bg-green-400' : 'bg-pink-400'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">Tanggal: {formatDate(item.date)}</span>
                      {item.due_date && (
                        <span className={`text-xs flex items-center gap-1 ${dueLbl?.color}`}>
                          <Clock size={11} /> Jatuh tempo: {formatDate(item.due_date)}
                          {dueLbl && ` (${dueLbl.label})`}
                        </span>
                      )}
                      <span className={`ml-auto text-xs font-medium ${isFullyPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isFullyPaid ? '✓ Lunas' : '◷ Belum Lunas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${editItem ? 'Edit' : 'Tambah'} ${activeTab === 'utang' ? 'Utang' : 'Piutang'}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{activeTab === 'utang' ? 'Nama Pemberi Pinjaman' : 'Nama Pelanggan'} *</label>
            <input className="input-field text-sm" placeholder="Nama" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal *</label>
              <input type="date" className="input-field text-sm" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp) *</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo</label>
            <input type="date" className="input-field text-sm" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
            <textarea className="input-field text-sm resize-none" rows={2} placeholder="Keterangan..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!showPayModal} onClose={() => setShowPayModal(null)} title="Catat Pembayaran">
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="bg-pink-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Nama: <b className="text-gray-800">{showPayModal?.name}</b></p>
            <p className="text-sm text-gray-500 mt-1">Sisa: <b className="text-red-600">{formatRupiah(showPayModal ? getRemaining(showPayModal, type) : 0)}</b></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Pembayaran (Rp) *</label>
            <input type="number" className="input-field" placeholder="0" value={payForm.amount}
              onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} required min="1"
              max={showPayModal ? getRemaining(showPayModal, type) : undefined} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pembayaran</label>
            <input type="date" className="input-field" value={payForm.date} onChange={e => setPayForm(f => ({...f, date: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
            <input className="input-field text-sm" placeholder="Catatan pembayaran..." value={payForm.note} onChange={e => setPayForm(f => ({...f, note: e.target.value}))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPayModal(null)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Menyimpan...' : 'Catat Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)}
        title="Hapus Data" message="Apakah Anda yakin ingin menghapus data ini? Seluruh riwayat pembayaran juga akan terhapus." />
    </div>
  )
}
