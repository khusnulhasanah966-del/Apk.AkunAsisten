import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, User, Building2 } from 'lucide-react'
import { getTable } from '../lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])

  useEffect(() => {
    try {
      const users = getTable('users') || []
      const profiles = getTable('profiles') || []
      const list = users.map(u => {
        const prof = profiles.find(p => p.id === u.id || p.email.toLowerCase() === u.email.toLowerCase())
        return {
          id: u.id,
          email: u.email,
          password: u.password,
          fullName: prof?.full_name || u.user_metadata?.full_name || u.email.split('@')[0],
          businessName: prof?.business_name || u.user_metadata?.business_name || `Usaha ${u.email.split('@')[0]}`,
        }
      })
      setSavedAccounts(list)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      addToast('Email dan password wajib diisi!', 'warning')
      return
    }
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      addToast('Selamat datang di AkunAsisten!', 'success')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      addToast(err.message === 'Invalid login credentials' ? 'Email atau password salah.' : err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAccount = async (acc) => {
    setLoading(true)
    try {
      await signIn(acc.email, acc.password || 'password123')
      addToast(`Masuk sebagai ${acc.fullName} (${acc.businessName})`, 'success')
      navigate('/dashboard')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async () => {
    setLoading(true)
    try {
      await signIn('riska@gmail.com', 'password123')
      addToast('Masuk sebagai Bu Sari (Warung Makan Bu Sari)', 'success')
      navigate('/dashboard')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f05080] via-[#ec4899] to-[#db2777] flex items-center justify-center p-4 font-sans">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
          {/* Header with Official AkunAsisten Logo */}
          <div className="bg-gradient-to-b from-pink-50/80 to-white px-8 pt-8 pb-4 text-center border-b border-pink-50">
            <div className="w-24 h-24 mx-auto mb-3 p-2 bg-white rounded-2xl shadow-sm border border-pink-100 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo AkunAsisten"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-gray-900 text-2xl font-black tracking-tight">AkunAsisten</h1>
            <p className="text-gray-500 text-xs mt-1 font-medium">
              Platform Akuntansi Digital Klien UMKM
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-800 font-bold text-lg">Masuk ke Akun</h2>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                <CheckCircle2 size={12} /> Multi-Akun UMKM
              </span>
            </div>

            {/* Quick Switcher for Existing Accounts in Browser */}
            {savedAccounts.length > 0 && (
              <div className="mb-5 bg-pink-50/50 rounded-2xl p-3 border border-pink-100">
                <p className="text-[11px] font-bold text-[#f05080] mb-2 uppercase tracking-wider flex items-center gap-1">
                  <User size={13} /> Pilih Akun Cepat (Tersimpan):
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {savedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      disabled={loading}
                      className="w-full text-left bg-white hover:bg-pink-100/70 border border-pink-100 hover:border-pink-300 rounded-xl px-3 py-2 flex items-center justify-between transition-all group shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 group-hover:text-[#f05080] truncate">
                          {acc.businessName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {acc.fullName} · {acc.email}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#f05080] ml-2 group-hover:translate-x-0.5 transition-transform">
                        Masuk →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Pengguna</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-10 text-sm"
                    placeholder="nama@usahaanda.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field pl-10 pr-10 text-sm"
                    placeholder="Masukkan password akun"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f05080]"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#f05080] hover:bg-[#e03f70] text-white py-3 rounded-2xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Masuk ke Dashboard <ArrowRight size={17} /></>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-pink-200 text-[#f05080] font-bold hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Sparkles size={15} />
                Masuk Cepat Demo: Warung Makan Bu Sari
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-5">
              Belum punya akun?{' '}
              <Link to="/register" className="text-[#f05080] font-bold hover:underline">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2.5 text-center border border-white/20">
          <p className="text-white text-xs font-medium">
            🌸 Setiap akun memiliki data, nama usaha, dan dashboard terpisah
          </p>
        </div>
      </div>
    </div>
  )
}
