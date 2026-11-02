import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Eye, EyeOff, Lock, Mail, User, Briefcase, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const { signUp, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.businessName || !form.email || !form.password) {
      addToast('Semua kolom wajib diisi!', 'warning')
      return
    }
    if (form.password !== form.confirmPassword) {
      addToast('Password dan konfirmasi password tidak sama!', 'error')
      return
    }
    if (form.password.length < 6) {
      addToast('Password minimal 6 karakter!', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await signUp(form.email, form.password, {
        full_name: form.fullName,
        business_name: form.businessName,
      })
      const user = res?.user || res?.data?.user

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: form.fullName,
          business_name: form.businessName,
          email: form.email,
        })
        if (fetchProfile) {
          await fetchProfile(user.id, {
            id: user.id,
            email: form.email,
            user_metadata: {
              full_name: form.fullName,
              business_name: form.businessName,
            },
          })
        }
      }
      addToast(`Selamat datang, ${form.fullName}! Akun ${form.businessName} berhasil dibuat.`, 'success')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      addToast(err.message || 'Gagal mendaftar akun', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f05080] via-[#ec4899] to-[#db2777] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
          {/* Header with Official Logo */}
          <div className="bg-gradient-to-b from-pink-50/80 to-white px-8 pt-6 pb-4 text-center border-b border-pink-50">
            <div className="w-20 h-20 mx-auto mb-2 p-1.5 bg-white rounded-2xl shadow-sm border border-pink-100 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo AkunAsisten"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-gray-900 text-xl font-black tracking-tight">AkunAsisten</h1>
            <p className="text-gray-500 text-xs mt-0.5 font-medium">
              Daftar Akun Baru Akuntansi UMKM
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10 text-xs font-medium"
                    placeholder="Contoh: Bu Sari"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Usaha</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10 text-xs font-medium"
                    placeholder="Contoh: Warung Makan Bu Sari"
                    value={form.businessName}
                    onChange={e => setForm({ ...form, businessName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-10 text-xs font-medium"
                    placeholder="sari@warung.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field pl-10 pr-10 text-xs font-medium"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f05080]"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field pl-10 text-xs font-medium"
                    placeholder="Ulangi password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f05080] hover:bg-[#e03f70] text-white py-3 rounded-2xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Daftar Akun Sekarang <ArrowRight size={17} /></>
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-4">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#f05080] font-bold hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
