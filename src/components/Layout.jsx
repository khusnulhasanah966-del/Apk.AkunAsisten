import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, ArrowLeftRight, Package, CreditCard,
  FileBarChart, BookOpen, UserCircle, LogOut, Menu, X,
  ChevronRight, Bell, MessageCircle, HelpCircle
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { path: '/stok', label: 'Stok Barang', icon: Package },
  { path: '/utang-piutang', label: 'Utang-Piutang', icon: CreditCard },
  { path: '/laporan', label: 'Laporan', icon: FileBarChart },
  { path: '/pelatihan', label: 'Pelatihan', icon: BookOpen },
  { path: '/profil', label: 'Akun / Profil', icon: UserCircle },
]

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const businessName = profile?.business_name || user?.user_metadata?.business_name || (user?.email ? `Usaha ${user.email.split('@')[0]}` : 'Usaha Saya')
  const ownerName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Pemilik Usaha')
  const initialLetter = (ownerName || 'U')[0].toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const currentPage = navItems.find(item => location.pathname.startsWith(item.path))

  return (
    <div className="min-h-screen bg-[#fff7fa] flex flex-col font-sans">
      {/* Top Browser Chrome Simulation (from Prototype) */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-pink-500 via-[#f43f85] to-pink-600 text-white text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-200/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-pink-200/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-pink-200/80"></div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-6 py-1 rounded-full text-white/95 font-medium tracking-wide">
          app.akunasisten.id{location.pathname}
        </div>
        <div className="text-pink-100 text-[11px] font-medium">
          {businessName} · AkunAsisten
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 
          bg-gradient-to-b from-[#f05080] to-[#ec4899]
          flex flex-col shadow-xl transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo Card (Exactly like Prototype) */}
          <div className="p-5 pb-3">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center justify-center relative">
              <img
                src="/logo.png"
                alt="AkunAsisten Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hidden flex-col items-center">
                <span className="text-[#f05080] text-xl font-black tracking-wider">AKUN ASISTEN</span>
              </div>
              <button
                className="absolute right-2 top-2 lg:hidden text-gray-400 hover:text-pink-500"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* User mini badge */}
          <div className="px-5 py-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-white">
              <div className="w-7 h-7 rounded-full bg-white text-[#f05080] font-bold text-xs flex items-center justify-center flex-shrink-0">
                {initialLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight">{businessName}</p>
                <p className="text-[10px] text-pink-100 truncate">{ownerName}</p>
              </div>
            </div>
          </div>

          {/* Navigation Items (Exact Prototype Styling: bullet style + active white pill) */}
          <nav className="flex-1 px-4 py-3 overflow-y-auto space-y-1.5">
            {navItems.map(({ path, label }) => {
              const isActive = location.pathname.startsWith(path)
              return (
                <button
                  key={path}
                  onClick={() => { navigate(path); setSidebarOpen(false) }}
                  className={`w-full text-left text-sm font-semibold transition-all duration-200 flex items-center gap-3 px-4 py-2.5 ${
                    isActive
                      ? 'bg-white text-[#f05080] rounded-full shadow-md font-bold'
                      : 'text-white/90 hover:text-white hover:bg-white/10 rounded-full'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#f05080]' : 'bg-white'}`}></span>
                  <span className="flex-1">{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Bottom Widget: "Butuh bantuan? Hubungi pendamping" (From Prototype) */}
          <div className="p-4 mx-4 mb-3 bg-white/15 backdrop-blur-sm rounded-2xl text-white">
            <p className="font-bold text-xs">Butuh bantuan?</p>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-[11px] text-pink-100 hover:text-white underline underline-offset-2 mt-0.5 block text-left"
            >
              Hubungi pendamping →
            </button>
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-pink-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={14} />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header Bar */}
          <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-xl bg-pink-50 text-[#f05080] hover:bg-pink-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="font-bold text-gray-800 text-lg leading-tight">
                  {currentPage?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">
                  {businessName} · Akuntansi Digital UMKM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelpModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-[#f05080] hover:bg-pink-100 text-xs font-semibold transition-colors"
              >
                <HelpCircle size={14} />
                <span>Bantuan</span>
              </button>
              <button
                onClick={() => navigate('/profil')}
                className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-100"
              >
                <div className="w-7 h-7 rounded-full bg-[#f05080] text-white flex items-center justify-center text-xs font-bold">
                  {initialLetter}
                </div>
                <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
                  {ownerName}
                </span>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 lg:p-7 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile (Exact Prototype: Beranda, Catat, Laporan, Akun) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 shadow-xl z-40 px-3 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-xl transition-colors ${
              location.pathname.startsWith('/dashboard') ? 'text-[#f05080]' : 'text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${location.pathname.startsWith('/dashboard') ? 'bg-[#f05080]' : 'bg-transparent'}`}></span>
            <span>Beranda</span>
          </button>

          <button
            onClick={() => navigate('/transaksi')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-xl transition-colors ${
              location.pathname.startsWith('/transaksi') ? 'text-[#f05080]' : 'text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${location.pathname.startsWith('/transaksi') ? 'bg-[#f05080]' : 'bg-transparent'}`}></span>
            <span>Catat</span>
          </button>

          <button
            onClick={() => navigate('/laporan')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-xl transition-colors ${
              location.pathname.startsWith('/laporan') ? 'text-[#f05080]' : 'text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${location.pathname.startsWith('/laporan') ? 'bg-[#f05080]' : 'bg-transparent'}`}></span>
            <span>Laporan</span>
          </button>

          <button
            onClick={() => navigate('/profil')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-xl transition-colors ${
              location.pathname.startsWith('/profil') ? 'text-[#f05080]' : 'text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${location.pathname.startsWith('/profil') ? 'bg-[#f05080]' : 'bg-transparent'}`}></span>
            <span>Akun</span>
          </button>
        </div>
      </nav>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#f05080]">
              <MessageCircle size={28} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Pendamping Keuangan UMKM</h3>
            <p className="text-gray-500 text-xs mb-5 leading-relaxed">
              Tim AkunAsisten siap membimbing pencatatan akuntansi dan laporan keuangan usaha Anda.
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/6281234567890?text=Halo%20AkunAsisten,%20saya%20butuh%20bantuan%20pembukuan%20UMKM"
                target="_blank"
                rel="noreferrer"
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle size={16} /> Hubungi via WhatsApp
              </a>
              <button
                onClick={() => { setShowHelpModal(false); navigate('/pelatihan') }}
                className="w-full py-2.5 rounded-xl border border-pink-200 text-pink-600 font-semibold text-xs hover:bg-pink-50"
              >
                Buka Materi Pelatihan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
