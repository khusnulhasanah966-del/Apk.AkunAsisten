import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { User, Mail, Phone, MapPin, Briefcase, Camera, Lock, Save, LogOut, Eye, EyeOff, Shield, Database, Check, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilPage() {
  const { user, profile, updateProfile, signOut, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [form, setForm] = useState({
    full_name: '', business_name: '', email: '', phone: '', address: '', avatar_url: ''
  })
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })

  // Supabase cloud config state
  const [sbConfig, setSbConfig] = useState({
    url: typeof window !== 'undefined' ? localStorage.getItem('AKUNASISTEN_SUPABASE_URL') || '' : '',
    key: typeof window !== 'undefined' ? localStorage.getItem('AKUNASISTEN_SUPABASE_KEY') || '' : '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [profile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile({
        full_name: form.full_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        avatar_url: form.avatar_url,
      })
      addToast('Profil berhasil diperbarui!', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const filename = `avatars/${user.id}.${ext}`
      await supabase.storage.from('uploads').upload(filename, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filename)
      setForm(f => ({ ...f, avatar_url: publicUrl }))
      await updateProfile({ avatar_url: publicUrl })
      addToast('Foto profil berhasil diperbarui!', 'success')
    } catch (err) {
      addToast('Gagal mengunggah foto', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      addToast('Konfirmasi password tidak cocok!', 'error')
      return
    }
    if (pwForm.newPassword.length < 6) {
      addToast('Password minimal 6 karakter!', 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword })
      if (error) throw error
      addToast('Password berhasil diubah!', 'success')
      setShowPwModal(false)
      setPwForm({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault()
    if (sbConfig.url && sbConfig.key) {
      localStorage.setItem('AKUNASISTEN_SUPABASE_URL', sbConfig.url.trim())
      localStorage.setItem('AKUNASISTEN_SUPABASE_KEY', sbConfig.key.trim())
      addToast('Konfigurasi Supabase disimpan! Halaman akan dimuat ulang.', 'success')
      setTimeout(() => window.location.reload(), 1200)
    } else {
      localStorage.removeItem('AKUNASISTEN_SUPABASE_URL')
      localStorage.removeItem('AKUNASISTEN_SUPABASE_KEY')
      addToast('Menggunakan mode penyimpanan lokal (Offline-ready)', 'info')
      setTimeout(() => window.location.reload(), 1200)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const hasCloudSupabase = isSupabaseConfigured()

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Akun & Profil</h1>
        <p className="text-gray-500 text-sm">Kelola informasi akun dan usaha Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-pink-100 w-fit">
        {[{val:'profile',label:'Profil'},{val:'account',label:'Pengaturan Akun & Database'}].map(t => (
          <button key={t.val} onClick={() => setActiveTab(t.val)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.val ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-500 hover:text-pink-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Foto Profil</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-pink-200" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center border-4 border-pink-200">
                    <span className="text-white text-2xl font-bold">{(form.full_name || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-pink-600 transition-colors">
                  {uploadingAvatar ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={13} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{form.full_name || 'Nama Pengguna'}</p>
                <p className="text-gray-500 text-sm">{form.business_name || 'Nama Usaha'}</p>
                <p className="text-pink-400 text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-700">Informasi Pribadi</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-10 text-sm" placeholder="Nama lengkap Anda" value={form.full_name}
                  onChange={e => setForm(f => ({...f, full_name: e.target.value}))} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Usaha *</label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-10 text-sm" placeholder="Nama usaha Anda" value={form.business_name}
                  onChange={e => setForm(f => ({...f, business_name: e.target.value}))} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-10 text-sm" placeholder="08xxxxxxxxxx" value={form.phone}
                  onChange={e => setForm(f => ({...f, phone: e.target.value}))} type="tel" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Usaha</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <textarea className="input-field pl-10 text-sm resize-none" rows={3} placeholder="Alamat lengkap usaha..."
                  value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'account' && (
        <div className="space-y-4">
          {/* Account Info */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700">Informasi Akun</h3>
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <Mail size={18} className="text-pink-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email Akun</p>
                <p className="font-medium text-gray-800 text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <Shield size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Status Akun</p>
                <p className="font-medium text-green-700 text-sm">Aktif & Siap Digunakan ✓</p>
              </div>
            </div>
          </div>

          {/* Database & Supabase Integration */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Database size={18} className="text-pink-500" /> Integrasi Database Supabase
              </h3>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                hasCloudSupabase ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'
              }`}>
                {hasCloudSupabase ? '☁️ Supabase Cloud Terhubung' : '💾 Penyimpanan Lokal Aktif'}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              AkunAsisten dapat menyimpan data secara lokal di perangkat Anda (tanpa perlu setup) atau terhubung ke cloud Supabase secara real-time.
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  className="input-field text-xs"
                  placeholder="https://xyzcompany.supabase.co"
                  value={sbConfig.url}
                  onChange={e => setSbConfig({ ...sbConfig, url: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supabase Anon Public Key</label>
                <input
                  type="text"
                  className="input-field text-xs font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbConfig.key}
                  onChange={e => setSbConfig({ ...sbConfig, key: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                  <Save size={14} /> Simpan Konfigurasi
                </button>
                {(sbConfig.url || sbConfig.key) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSbConfig({ url: '', key: '' })
                      localStorage.removeItem('AKUNASISTEN_SUPABASE_URL')
                      localStorage.removeItem('AKUNASISTEN_SUPABASE_KEY')
                      addToast('Kembali ke mode penyimpanan lokal', 'info')
                      setTimeout(() => window.location.reload(), 1000)
                    }}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} /> Reset ke Mode Lokal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Security */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700">Keamanan</h3>
            <button onClick={() => setShowPwModal(true)}
              className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-pink-50 rounded-xl transition-colors group">
              <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center">
                <Lock size={16} className="text-pink-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-800 text-sm">Ubah Password</p>
                <p className="text-xs text-gray-400">Ganti password akun Anda</p>
              </div>
              <span className="text-gray-300 group-hover:text-pink-400">›</span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-100">
            <h3 className="font-semibold text-red-600 mb-3">Keluar dari Akun</h3>
            <button onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 p-3.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-red-600">
              <LogOut size={18} />
              <span className="font-medium text-sm">Keluar dari AkunAsisten</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal isOpen={showPwModal} onClose={() => setShowPwModal(false)} title="Ubah Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru *</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input-field text-sm pr-10" placeholder="Minimal 6 karakter"
                value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru *</label>
            <input type={showPw ? 'text' : 'password'} className="input-field text-sm" placeholder="Ulangi password baru"
              value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPwModal(false)} className="flex-1 btn-secondary">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showLogoutConfirm} onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)}
        title="Keluar dari Akun" message="Apakah Anda yakin ingin keluar dari AkunAsisten?"
        confirmLabel="Keluar" confirmColor="bg-red-500 hover:bg-red-600" />
    </div>
  )
}
