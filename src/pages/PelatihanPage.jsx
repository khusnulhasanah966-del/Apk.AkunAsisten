import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  BookOpen, ChevronRight, CheckCircle2, Circle, Clock,
  Award, Sparkles, Plus, Edit2, Trash2, RotateCcw,
  BookCheck, Check, Layers, Star
} from 'lucide-react'

const MATERIAL_CATEGORIES = [
  'Dasar Akuntansi',
  'Pemasukan & Kasir',
  'Pengeluaran & Beban',
  'Stok & HPP',
  'Utang & Piutang',
  'Laporan & Neraca',
  'Strategi Bisnis & Modal',
]

export const COMPREHENSIVE_MODULES = [
  {
    title: 'Modul 1: Dasar-Dasar Akuntansi & Mindset Keuangan UMKM',
    category: 'Dasar Akuntansi',
    duration: 12,
    content: `## 🎯 Tujuan Pembelajaran
Setelah menyelesaikan modul ini, Anda akan memahami prinsip dasar pembukuan modern dan tidak lagi mencampuradukkan uang usaha dengan kebutuhan pribadi.

---

### 1. Mengapa 80% UMKM Gagal dalam 3 Tahun Pertama?
Banyak pemilik UMKM mengira usahanya untung karena penjualan ramai, namun di akhir bulan kas selalu kosong. Penyebab utamanya adalah:
- Tidak memiliki catatan arus kas harian.
- Mengambil uang kasir untuk belanja dapur rumah tangga tanpa dicatat.
- Tidak mengetahui apakah harga jual sudah menutup seluruh biaya bahan dan operasional.

> **Prinsip Emas Akuntansi UMKM:**
> Usaha Anda adalah "badan terpisah" dari diri Anda pribadi. Anda harus menggaji diri sendiri, bukan mengambil keuntungan sesuka hati dari laci kasir!

---

### 2. Persamaan Dasar Akuntansi
Seluruh sistem akuntansi dunia berpegang pada satu rumus keseimbangan:
\`\`\`
AKTIVA (ASET) = KEWAJIBAN (UTANG) + EKUITAS (MODAL)
\`\`\`
- **Aset**: Semua yang dimiliki usaha (uang tunai, saldo rekening, persediaan stok bahan, etalase, peralatan).
- **Kewajiban**: Tagihan dari pihak lain (utang bahan baku ke supplier, cicilan sewa).
- **Ekuitas**: Hak bersih pemilik atas usaha setelah dikurangi seluruh kewajiban.

---

### 3. Checklist Aksi Hari Ini:
- [x] Siapkan 1 dompet / rekening bank khusus yang HANYA digunakan untuk transaksi usaha.
- [x] Buat aturan: Setiap pengeluaran pribadi harus dicatat sebagai **Prive** atau **Gaji Pemilik**.
- [x] Lakukan pembukuan harian minimal 5 menit setiap malam sebelum tidur menggunakan AkunAsisten.`,
  },
  {
    title: 'Modul 2: Cara Efektif Mencatat Pemasukan & Rekap Kasir Harian',
    category: 'Pemasukan & Kasir',
    duration: 10,
    content: `## 🎯 Tujuan Pembelajaran
Memahami cara mencatat seluruh saluran pemasukan (penjualan tunai, transfer bank, QRIS, dan katering) secara rapi dan akurat.

---

### 1. Klasifikasi Jenis Pemasukan Usaha
Tidak semua uang yang masuk ke kasir adalah keuntungan murni:
1. **Pendapatan Usaha Utama (Penjualan Harian)**: Uang hasil penjualan barang dagangan atau jasa sehari-hari.
2. **Pendapatan Non-Operasional**: Pendapatan sampingan, seperti penjualan kardus/minyak jelantah sisa, komisi titipan barang, atau bunga bank.
3. **Pelunasan Piutang**: Uang masuk dari pelanggan yang membayar utang masa lalu (ini BUKAN penjualan baru, melainkan konversi piutang menjadi kas).

---

### 2. SOP Rekap Kasir Saat Tutup Toko (End-of-Day Balancing)
Setiap malam saat toko tutup, lakukan 3 langkah ini:
1. Hitung total uang fisik di laci kasir (misal Rp 1.500.000).
2. Periksa rekap mutasi QRIS dan transfer bank (misal Rp 750.000).
3. Buka menu **Transaksi** di AkunAsisten → klik **+ Catat Transaksi** → masukkan total penjualan hari ini.

> **Tips Praktis:**
> Jika ada selisih lebih atau kurang pada uang fisik kasir, catat selisih tersebut di kolom Catatan agar Anda dapat mendeteksi kelalaian staf kasir sejak dini.`,
  },
  {
    title: 'Modul 3: Manajemen Pengeluaran & Mengendalikan Pemborosan',
    category: 'Pengeluaran & Beban',
    duration: 12,
    content: `## 🎯 Tujuan Pembelajaran
Mampu membedakan Beban Pokok Penjualan (HPP) dengan Beban Operasional, serta mengidentifikasi 5 pos kebocoran dana UMKM.

---

### 1. Perbedaan Dua Jenis Pengeluaran
Dalam laporan laba rugi standar, pengeluaran dibagi menjadi dua kelompok besar:

| Jenis Beban | Contoh Nyata | Sifat |
|---|---|---|
| **Beban Pokok (Bahan Baku)** | Beras, ayam, bumbu, kemasan mika, plastik | Tergantung jumlah porsi yang terjual (Variabel) |
| **Beban Operasional** | Gaji karyawan, listrik, gas LPG, internet, sewa tempat | Tetap keluar meski penjualan sedang sepi (Tetap) |

---

### 2. 5 Titik Kebocoran Keuangan UMKM yang Sering Terjadi:
1. **Bahan baku kadaluarsa / terbuang**: Akibat belanja berlebihan tanpa melihat perputaran stok.
2. **Biaya transportasi & parkir harian**: Sering membeli bahan eceran berkali-kali dalam sehari.
3. **Biaya listrik & gas yang boros**: Pemakaian pendingin ruangan atau kompor yang tidak efisien.
4. **Nota hilang**: Belanja tanpa meminta bukti nota membuat biaya tidak tercatat, sehingga laba terlihat semu dan pajak bisa membengkak.
5. **Penarikan pribadi tanpa batas**: Mengambil barang dagangan untuk konsumsi keluarga tanpa pencatatan.`,
  },
  {
    title: 'Modul 4: Pengelolaan Stok Barang & Menghitung HPP (Harga Pokok)',
    category: 'Stok & HPP',
    duration: 15,
    content: `## 🎯 Tujuan Pembelajaran
Mampu mengelola inventaris stok barang, menghitung nilai aset gudang, dan menetapkan batas stok menipis (Safety Stock).

---

### 1. Mengapa Stok Adalah Uang Tunai yang Berwujud?
Banyak pemilik toko hanya fokus pada saldo di rekening, padahal sebagian besar modal tertanam di dalam barang dagangan di rak dan lemari es!
- **Overstock (Kelebihan Stok)**: Modal mandek, risiko barang rusak dan kedaluwarsa.
- **Stockout (Kehabisan Stok)**: Pelanggan kecewa dan pindah membeli ke kompetitor.

---

### 2. Cara Menetapkan Batas Stok Menipis di AkunAsisten:
1. Buka menu **Stok Barang**.
2. Saat menambah barang, isi kolom **Batas Stok Menipis** (misal: 5 botol atau 8 ekor).
3. Jika persediaan mencapai angka tersebut, sistem otomatis memberi alert warna kuning di dashboard agar Anda segera memesan kembali ke supplier.

---

### 3. Rumus Sederhana Menghitung HPP Per Produk:
\`\`\`
HPP Per Porsi = Total Biaya Bahan Baku Utama + Bumbu + Kemasan
\`\`\`
*Contoh Paket Nasi Ayam Goreng:*
- Ayam 1 potong: Rp 7.000
- Nasi 1 porsi: Rp 1.500
- Minyak, bumbu & sambal: Rp 1.000
- Kotak bento & sendok: Rp 1.200
- **Total HPP: Rp 10.700 per porsi.**
Jika Anda menjualnya seharga Rp 18.000, maka Laba Kotor Anda adalah Rp 7.300 per porsi (Gross Margin 40%).`,
  },
  {
    title: 'Modul 5: Manajemen Utang Usaha & Piutang Pelanggan',
    category: 'Utang & Piutang',
    duration: 11,
    content: `## 🎯 Tujuan Pembelajaran
Memahami cara memanfaatkan utang usaha dari supplier secara aman dan menagih piutang pelanggan tepat waktu sebelum macet.

---

### 1. Utang Usaha (Trade Payable) yang Sehat
- **Utang Produktif**: Mengambil bahan baku dari supplier dengan termin pembayaran (misal bayar 14 hari kemudian). Anda bisa menjual barangnya terlebih dahulu, menerima kas, lalu melunasi tagihan tepat waktu tanpa bunga!
- **Utang Konsumtif / Berbahaya**: Meminjam pinjaman online berbunga harian untuk menutupi kerugian operasional usaha.

---

### 2. Aturan Emas Memberikan Piutang (Kredit) ke Pelanggan:
1. **Batasi Plafon**: Tetapkan batas maksimal nominal piutang untuk setiap pelanggan (misal maksimal Rp 500.000).
2. **Jatuh Tempo Jelas**: Sepakati tanggal jatuh tempo tertulis (misal 7 hari setelah pengiriman katering).
3. **Catat di Menu Utang-Piutang**: Masukkan nama pelanggan dan tanggal jatuh tempo agar Anda menerima notifikasi ketika tagihan mendekati waktu pelunasan.
4. **Follow-up Sopan**: Kirimkan pengingat ramah H-2 sebelum jatuh tempo.`,
  },
  {
    title: 'Modul 6: Membaca & Memahami 3 Laporan Keuangan Utama',
    category: 'Laporan & Neraca',
    duration: 16,
    content: `## 🎯 Tujuan Pembelajaran
Mampu membaca Laporan Laba Rugi, Laporan Perubahan Modal, dan Neraca Keuangan yang dihasilkan secara otomatis oleh AkunAsisten.

---

### 1. Laporan Laba Rugi (Profit & Loss Statement)
Menjawab pertanyaan: *"Berapa keuntungan bersih usaha saya bulan ini?"*
- **Pemasukan**: Seluruh omzet dari penjualan produk dan jasa.
- **Pengeluaran**: Seluruh biaya bahan baku, gaji, sewa, dan operasional.
- **Laba Bersih = Pemasukan - Pengeluaran.**

---

### 2. Laporan Perubahan Modal (Statement of Equity)
Menjawab pertanyaan: *"Apakah modal kekayaan usaha saya berkembang atau tergerus?"*
- **Modal Awal**: Saldo modal pada tanggal 1 bulan berjalan.
- **(+) Laba Bersih**: Hasil keuntungan bulan ini yang menambah modal.
- **(+) Setoran Modal Tambahan**: Jika pemilik menyuntikkan uang segar.
- **(-) Prive**: Uang usaha yang ditarik untuk keperluan pribadi pemilik.
- **(=) Modal Akhir**: Modal terkini per akhir bulan.

---

### 3. Neraca Keuangan (Balance Sheet)
Menjawab pertanyaan: *"Berapa total kekayaan, utang, dan nilai bersih usaha saya hari ini?"*
- Sisi Kiri (**Aktiva/Aset**): Kas di kasir + Piutang yang belum dibayar pelanggan + Stok barang di rak + Peralatan usaha.
- Sisi Kanan (**Pasiva**): Utang usaha yang harus dibayar ke supplier + Modal bersih pemilik.
- Nilai Sisi Kiri dan Sisi Kanan **wajib seimbang (balanced)**!`,
  },
  {
    title: 'Modul 7: Strategi Harga Jual, Titik Impas (BEP) & Akses KUR Bank',
    category: 'Strategi Bisnis & Modal',
    duration: 14,
    content: `## 🎯 Tujuan Pembelajaran
Menghitung Titik Impas harian agar usaha tidak rugi, serta memahami dokumen keuangan yang diwajibkan saat mengajukan Kredit Usaha Rakyat (KUR).

---

### 1. Cara Menghitung Titik Impas (Break Even Point / BEP)
BEP adalah jumlah penjualan minimal yang harus dicapai agar Anda tidak mengalami kerugian (pemasukan = seluruh biaya operasional).

\`\`\`
BEP Unit = Total Biaya Tetap Bulanan ÷ (Harga Jual per Porsi - HPP per Porsi)
\`\`\`

*Contoh Nyata Warung Makan Bu Sari:*
- Biaya tetap bulanan (sewa tempat, gaji staf, listrik): Rp 6.000.000
- Harga jual per porsi: Rp 18.000
- HPP per porsi: Rp 10.000 (Margin per porsi: Rp 8.000)
- **BEP = Rp 6.000.000 ÷ Rp 8.000 = 750 porsi per bulan (atau 25 porsi per hari).**
Artinya: Porsi ke-1 sampai ke-25 setiap hari dipakai untuk menutup biaya sewa dan gaji. Keuntungan bersih baru mulai Anda nikmati dari porsi ke-26 ke atas!

---

### 2. Syarat Dokumen Laporan Keuangan untuk Lolos Pengajuan KUR Bank:
Bankir dan analis kredit membutuhkan bukti pembukuan digital yang rapi:
1. Rekap Laporan Laba Rugi minimal 3 s/d 6 bulan terakhir.
2. Laporan Arus Kas yang membuktikan usaha memiliki kas positif.
3. Laporan Neraca yang menunjukkan nilai persediaan dan aset usaha.
Dengan mengeklik tombol **Unduh CSV / Cetak Laporan** di AkunAsisten, Anda sudah memiliki berkas pembukuan formal berstandar perbankan!`,
  },
]

export default function PelatihanPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [materials, setMaterials] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [showDetail, setShowDetail] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: 'Dasar Akuntansi',
    duration: 10,
    content: '',
  })

  useEffect(() => {
    if (user) fetchMaterials()
  }, [user])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const [{ data: mData }, { data: pData }] = await Promise.all([
        supabase.from('training_materials').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('training_progress').select('*').eq('user_id', user.id),
      ])

      if (!mData || mData.length === 0) {
        await initDefaultComprehensiveModules()
      } else {
        setMaterials(mData)
        setProgress(pData || [])
      }
    } catch (err) {
      console.error(err)
      addToast('Gagal memuat materi pelatihan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const initDefaultComprehensiveModules = async () => {
    try {
      const toInsert = COMPREHENSIVE_MODULES.map(m => ({
        ...m,
        user_id: user.id,
        is_default: true,
      }))
      const { data } = await supabase.from('training_materials').insert(toInsert)
      setMaterials(data || toInsert)
      addToast('7 Modul Pelatihan Akuntansi UMKM siap dipelajari!', 'success')
    } catch (e) {
      console.error(e)
    }
  }

  const handleResetToDefault = async () => {
    if (window.confirm('Muat ulang 7 modul pelatihan lengkap standar SAK EMKM?')) {
      setLoading(true)
      try {
        await supabase.from('training_materials').delete().eq('user_id', user.id)
        await initDefaultComprehensiveModules()
        fetchMaterials()
      } catch (err) {
        addToast('Gagal memuat ulang materi', 'error')
      } finally {
        setLoading(false)
      }
    }
  }

  const isCompleted = (matId) => {
    return progress.some(p => p.material_id === matId)
  }

  const toggleComplete = async (matId) => {
    const completed = isCompleted(matId)
    try {
      if (completed) {
        await supabase.from('training_progress').delete().eq('user_id', user.id).eq('material_id', matId)
        setProgress(p => p.filter(x => x.material_id !== matId))
        addToast('Tanda selesai dibatalkan', 'info')
      } else {
        const { data } = await supabase.from('training_progress').insert([{
          user_id: user.id,
          material_id: matId,
          completed_at: new Date().toISOString(),
        }]).select().single()
        setProgress(p => [...p, data || { material_id: matId }])
        addToast('🎉 Selamat! Anda telah menyelesaikan modul ini.', 'success')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        title: form.title,
        category: form.category,
        duration: Number(form.duration) || 10,
        content: form.content,
      }
      if (editItem) {
        await supabase.from('training_materials').update(payload).eq('id', editItem.id)
        addToast('Modul materi berhasil diperbarui!', 'success')
      } else {
        await supabase.from('training_materials').insert([payload])
        addToast('Modul materi baru berhasil ditambahkan!', 'success')
      }
      setShowModal(false)
      fetchMaterials()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await supabase.from('training_materials').delete().eq('id', deleteId)
      addToast('Materi berhasil dihapus!', 'success')
      setDeleteId(null)
      fetchMaterials()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const filtered = materials.filter(m => filterCat === 'all' || m.category === filterCat)
  const completedCount = materials.filter(m => isCompleted(m.id)).length
  const progressPercent = materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0

  const renderContentFormatted = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-black text-gray-900 mt-5 mb-2.5">{line.replace('## ', '')}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-extrabold text-[#f05080] mt-4 mb-2">{line.replace('### ', '')}</h3>
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-3 p-4 rounded-2xl bg-pink-50 border-l-4 border-[#f05080] text-xs font-semibold text-gray-800 leading-relaxed">
            {line.replace('> ', '')}
          </blockquote>
        )
      }
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        return (
          <div key={idx} className="flex items-center gap-2.5 my-1.5 text-xs font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{line.replace(/- \[[ x]\] /, '')}</span>
          </div>
        )
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 text-xs text-gray-600 my-1 list-disc">
            {line.replace('- ', '')}
          </li>
        )
      }
      if (line.startsWith('```')) {
        return null
      }
      if (line.trim() === '---') {
        return <hr key={idx} className="my-4 border-pink-100" />
      }
      if (line.startsWith('|')) {
        return <div key={idx} className="text-xs text-gray-600 font-mono py-1 overflow-x-auto">{line}</div>
      }
      if (line.trim() === '') return <br key={idx} />
      return <p key={idx} className="text-xs text-gray-700 leading-relaxed mb-2">{line}</p>
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Progress */}
      <div className="bg-gradient-to-r from-[#f05080] via-[#ec4899] to-[#db2777] rounded-3xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-3 tracking-wide uppercase">
              <Award size={14} /> Akademi Akuntansi UMKM
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              Modul Pelatihan Keuangan Digital
            </h1>
            <p className="text-xs lg:text-sm text-pink-100 mt-2 leading-relaxed">
              Panduan langkah demi langkah memahami akuntansi praktis, arus kas, stok barang, perhitungan HPP, hingga persiapan laporan keuangan untuk pengajuan KUR bank.
            </p>
          </div>

          {/* Progress Card inside Banner */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-pink-100">Progress Pembelajaran</span>
              <span className="text-white text-sm font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-pink-100 mt-2.5 text-right font-medium">
              <b>{completedCount}</b> dari <b>{materials.length}</b> modul diselesaikan
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-3xl">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCat === 'all'
                ? 'bg-[#f05080] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
              }`}
          >
            Semua Modul ({materials.length})
          </button>
          {MATERIAL_CATEGORIES.map(cat => {
            const count = materials.filter(m => m.category === cat).length
            if (count === 0 && filterCat !== cat) return null
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filterCat === cat
                    ? 'bg-[#f05080] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
                  }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-bold text-gray-600"
            title="Muat ulang modul default jika ingin memperbarui konten"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset Modul</span>
          </button>
          <button
            onClick={() => {
              setEditItem(null)
              setForm({ title: '', category: 'Dasar Akuntansi', duration: 10, content: '' })
              setShowModal(true)
            }}
            className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5 font-bold"
          >
            <Plus size={14} />
            <span>+ Tambah Materi</span>
          </button>
        </div>
      </div>

      {/* Module Grid List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" text="Memuat modul edukasi UMKM..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 text-pink-200" />
          <p className="text-sm font-bold text-gray-600">Belum ada modul di kategori ini</p>
          <button
            onClick={() => setFilterCat('all')}
            className="btn-secondary text-xs mt-3 py-1.5 px-4"
          >
            Tampilkan Semua Modul
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((mat, index) => {
            const completed = isCompleted(mat.id)
            return (
              <div
                key={mat.id || index}
                onClick={() => setShowDetail(mat)}
                className={`card p-6 border-2 transition-all duration-200 cursor-pointer hover:shadow-lg flex flex-col justify-between group relative overflow-hidden ${completed
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-pink-100 hover:border-[#f05080]'
                  }`}
              >
                {/* Top Badge Row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-pink-50 text-[#f05080] border border-pink-100">
                      {mat.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Clock size={12} />
                      <span className="font-semibold">{mat.duration || 10} mnt</span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-sm leading-snug group-hover:text-[#f05080] transition-colors mb-2.5">
                    {mat.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {mat.content.replace(/[#*`>-]/g, '').slice(0, 110)}...
                  </p>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <span className="text-[#f05080] text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Pelajari Modul <ChevronRight size={14} />
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleComplete(mat.id)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${completed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                  >
                    {completed ? <Check size={14} /> : <Circle size={14} />}
                    <span>{completed ? 'Selesai' : 'Tandai Selesai'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reader Modal (Membaca Materi Lengkap) */}
      {showDetail && (
        <Modal
          isOpen={!!showDetail}
          onClose={() => setShowDetail(null)}
          title={showDetail.title}
          size="lg"
        >
          <div className="space-y-4">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-pink-50/80 rounded-2xl border border-pink-100">
              <div className="flex items-center gap-2">
                <span className="badge-pink text-xs font-bold">{showDetail.category}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold">
                  <Clock size={13} /> Durasi: {showDetail.duration || 10} menit
                </span>
              </div>

              <button
                onClick={() => toggleComplete(showDetail.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isCompleted(showDetail.id)
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
              >
                {isCompleted(showDetail.id) ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Sudah Selesai Dipelajari ✓</span>
                  </>
                ) : (
                  <>
                    <Circle size={15} />
                    <span>Tandai Selesai Belajar</span>
                  </>
                )}
              </button>
            </div>

            {/* Formatted Content */}
            <div className="prose-pink max-w-none px-1 py-2">
              {renderContentFormatted(showDetail.content)}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditItem(showDetail)
                    setForm({
                      title: showDetail.title,
                      category: showDetail.category,
                      duration: showDetail.duration,
                      content: showDetail.content,
                    })
                    setShowDetail(null)
                    setShowModal(true)
                  }}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-gray-600"
                >
                  <Edit2 size={13} /> Edit Modul
                </button>
                <button
                  onClick={() => {
                    setDeleteId(showDetail.id)
                    setShowDetail(null)
                  }}
                  className="text-xs text-red-500 hover:text-red-700 py-1.5 px-3 rounded-xl hover:bg-red-50 flex items-center gap-1 font-semibold"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>

              <button
                onClick={() => {
                  toggleComplete(showDetail.id)
                  setShowDetail(null)
                }}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                {isCompleted(showDetail.id) ? 'Tutup Materi' : 'Selesai & Lanjut'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Module Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Modul Pelatihan' : 'Tambah Modul Pelatihan Baru'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Modul *</label>
            <input
              type="text"
              className="input-field text-xs font-semibold"
              placeholder="Contoh: Modul 8: Strategi Pemasaran Digital UMKM"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori Materi *</label>
              <select
                className="input-field text-xs font-semibold"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                required
              >
                {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Estimasi Durasi (Menit)</label>
              <input
                type="number"
                className="input-field text-xs"
                placeholder="10"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Isi Materi Lengkap</label>
            <p className="text-[11px] text-gray-400 mb-2">
              Tip: Gunakan <code>## Judul Bab</code>, <code>### Sub Bab</code>, <code>&gt; Quote Tips</code>, dan <code>- Poin materi</code>
            </p>
            <textarea
              className="input-field text-xs resize-none font-mono"
              rows={10}
              placeholder="Tuliskan modul edukasi di sini..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 btn-secondary text-xs py-2.5 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
            >
              {saving ? 'Menyimpan...' : 'Simpan Modul Pelatihan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Hapus Modul Pelatihan"
        message="Apakah Anda yakin ingin menghapus materi ini?"
      />
    </div>
  )
}
