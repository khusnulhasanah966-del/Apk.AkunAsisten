import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, formatDate } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown, X, Eye } from 'lucide-react'

const PRODUCT_CATEGORIES = ['Makanan', 'Minuman', 'Pakaian', 'Elektronik', 'Alat Tulis', 'Bahan Baku', 'Produk Jadi', 'Lainnya']

const initialForm = {
  name: '', code: '', category: '', quantity: 0, buy_price: '', sell_price: '',
  unit: 'pcs', low_stock_threshold: 5, description: ''
}

export default function StokPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showMovement, setShowMovement] = useState(null)
  const [showHistory, setShowHistory] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [movementForm, setMovementForm] = useState({ type: 'in', quantity: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => { if (user) fetchProducts() }, [user])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('name')
      setProducts(data || [])
    } catch (err) { addToast('Gagal memuat stok', 'error') }
    finally { setLoading(false) }
  }

  const fetchHistory = async (productId) => {
    const { data } = await supabase.from('stock_movements').select('*').eq('product_id', productId).order('created_at', { ascending: false })
    setMovements(data || [])
  }

  const openAdd = () => { setEditItem(null); setForm(initialForm); setShowModal(true) }
  const openEdit = (p) => {
    setEditItem(p)
    setForm({ name: p.name, code: p.code || '', category: p.category, quantity: p.quantity, buy_price: String(p.buy_price), sell_price: String(p.sell_price), unit: p.unit, low_stock_threshold: p.low_stock_threshold || 5, description: p.description || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        name: form.name,
        code: form.code,
        category: form.category,
        quantity: Number(form.quantity),
        buy_price: Number(form.buy_price),
        sell_price: Number(form.sell_price),
        unit: form.unit,
        low_stock_threshold: Number(form.low_stock_threshold),
        description: form.description,
      }
      if (editItem) {
        const { error } = await supabase.from('products').update(payload).eq('id', editItem.id)
        if (error) throw error
        addToast('Barang berhasil diperbarui!', 'success')
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
        addToast('Barang berhasil ditambahkan!', 'success')
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) { addToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteId)
      if (error) throw error
      addToast('Barang berhasil dihapus!', 'success')
      setDeleteId(null)
      fetchProducts()
    } catch (err) { addToast(err.message, 'error') }
  }

  const handleMovement = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const qty = Number(movementForm.quantity)
      const product = showMovement
      const newQty = movementForm.type === 'in' ? product.quantity + qty : Math.max(0, product.quantity - qty)

      await supabase.from('products').update({ quantity: newQty }).eq('id', product.id)
      await supabase.from('stock_movements').insert([{
        product_id: product.id,
        user_id: user.id,
        type: movementForm.type,
        quantity: qty,
        note: movementForm.note,
        quantity_after: newQty,
      }])
      addToast(`Stok berhasil ${movementForm.type === 'in' ? 'ditambah' : 'dikurangi'}!`, 'success')
      setShowMovement(null)
      setMovementForm({ type: 'in', quantity: '', note: '' })
      fetchProducts()
    } catch (err) { addToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchTab = activeTab === 'all' || (activeTab === 'low' && p.quantity <= p.low_stock_threshold && p.quantity > 0) || (activeTab === 'empty' && p.quantity === 0)
    return matchSearch && matchCat && matchTab
  })

  const lowStockCount = products.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0).length
  const emptyCount = products.filter(p => p.quantity === 0).length

  const getStockStatus = (p) => {
    if (p.quantity === 0) return { label: 'Habis', className: 'badge-red' }
    if (p.quantity <= p.low_stock_threshold) return { label: 'Menipis', className: 'badge-yellow' }
    return { label: 'Tersedia', className: 'badge-green' }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Stok Barang</h1>
          <p className="text-gray-500 text-sm">Kelola persediaan barang usaha Anda</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tambah Barang
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Total Barang</p>
          <p className="text-2xl font-bold text-gray-800">{products.length}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100 cursor-pointer" onClick={() => setActiveTab('low')}>
          <div className="flex items-center gap-1 mb-1"><AlertTriangle size={14} className="text-yellow-500" /><p className="text-xs text-yellow-700 font-medium">Stok Menipis</p></div>
          <p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p>
        </div>
        <div className="card bg-red-50 border-red-100 cursor-pointer" onClick={() => setActiveTab('empty')}>
          <div className="flex items-center gap-1 mb-1"><Package size={14} className="text-red-500" /><p className="text-xs text-red-700 font-medium">Stok Habis</p></div>
          <p className="text-2xl font-bold text-red-700">{emptyCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{val:'all',label:'Semua'},{val:'low',label:'Menipis'},{val:'empty',label:'Habis'}].map(t => (
          <button key={t.val} onClick={() => setActiveTab(t.val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.val ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card py-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9 text-sm py-2" placeholder="Cari barang..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field text-sm w-auto py-2" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">Semua Kategori</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner text="Memuat data barang..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada barang" description="Tambahkan barang untuk mengelola stok usaha Anda"
          action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tambah Barang</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-pink-50 border-b border-pink-100">
                <tr>
                  {['Barang', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Status', 'Aksi'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 ${h === 'Barang' || h === 'Aksi' ? 'text-left' : h === 'Nominal' ? 'text-right' : 'text-left'} ${['Kategori','Harga Beli'].includes(h) ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {filtered.map(p => {
                  const status = getStockStatus(p)
                  return (
                    <tr key={p.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.code || 'Tanpa kode'} · {p.unit}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className="badge-pink text-xs">{p.category}</span></td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${p.quantity === 0 ? 'text-red-600' : p.quantity <= p.low_stock_threshold ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {p.quantity} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600">{formatRupiah(p.buy_price)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatRupiah(p.sell_price)}</td>
                      <td className="px-4 py-3"><span className={`${status.className} text-xs`}>{status.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setShowMovement(p); setMovementForm({ type: 'in', quantity: '', note: '' }) }} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500" title="Ubah stok">
                            <TrendingUp size={15} />
                          </button>
                          <button onClick={() => { fetchHistory(p.id); setShowHistory(p) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Riwayat">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Barang' : 'Tambah Barang'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Barang *</label>
              <input className="input-field text-sm" placeholder="Nama barang" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Barang</label>
              <input className="input-field text-sm" placeholder="Contoh: BRG-001" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori *</label>
              <select className="input-field text-sm" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} required>
                <option value="">Pilih kategori</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Stok *</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Satuan</label>
              <input className="input-field text-sm" placeholder="pcs / kg / liter" value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Beli (Rp) *</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={form.buy_price} onChange={e => setForm(f => ({...f, buy_price: e.target.value}))} required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga Jual (Rp) *</label>
              <input type="number" className="input-field text-sm" placeholder="0" value={form.sell_price} onChange={e => setForm(f => ({...f, sell_price: e.target.value}))} required min="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Batas Stok Menipis</label>
              <input type="number" className="input-field text-sm" placeholder="5" value={form.low_stock_threshold} onChange={e => setForm(f => ({...f, low_stock_threshold: e.target.value}))} min="0" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Movement Modal */}
      <Modal isOpen={!!showMovement} onClose={() => setShowMovement(null)} title={`Ubah Stok: ${showMovement?.name}`}>
        <form onSubmit={handleMovement} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[{val:'in',label:'➕ Tambah Stok'},{val:'out',label:'➖ Kurangi Stok'}].map(t => (
              <button key={t.val} type="button"
                onClick={() => setMovementForm(f => ({...f, type: t.val}))}
                className={`py-3 rounded-xl font-medium text-sm border-2 transition-all ${movementForm.type === t.val
                  ? t.val === 'in' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-500'}`}>{t.label}</button>
            ))}
          </div>
          <div className="bg-pink-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Stok saat ini</p>
            <p className="text-2xl font-bold text-pink-600">{showMovement?.quantity} {showMovement?.unit}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
            <input type="number" className="input-field" placeholder="0" value={movementForm.quantity}
              onChange={e => setMovementForm(f => ({...f, quantity: e.target.value}))} required min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
            <input className="input-field text-sm" placeholder="Keterangan perubahan stok..." value={movementForm.note}
              onChange={e => setMovementForm(f => ({...f, note: e.target.value}))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowMovement(null)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={!!showHistory} onClose={() => setShowHistory(null)} title={`Riwayat Stok: ${showHistory?.name}`}>
        {movements.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Belum ada riwayat perubahan stok</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {m.type === 'in' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{m.type === 'in' ? 'Tambah' : 'Kurangi'} {m.quantity} unit</p>
                  <p className="text-xs text-gray-400">{m.note || '-'} · {formatDate(m.created_at)}</p>
                </div>
                <span className="text-sm text-gray-600">Sisa: <b>{m.quantity_after}</b></span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
        title="Hapus Barang" message="Apakah Anda yakin ingin menghapus barang ini?" />
    </div>
  )
}
