import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TransaksiPage from './pages/TransaksiPage'
import StokPage from './pages/StokPage'
import UtangPiutangPage from './pages/UtangPiutangPage'
import LaporanPage from './pages/LaporanPage'
import PelatihanPage from './pages/PelatihanPage'
import ProfilPage from './pages/ProfilPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-2xl font-bold">A</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
        </div>
        <p className="text-pink-500 font-medium">Memuat AkunAsisten...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="transaksi" element={<TransaksiPage />} />
              <Route path="stok" element={<StokPage />} />
              <Route path="utang-piutang" element={<UtangPiutangPage />} />
              <Route path="laporan" element={<LaporanPage />} />
              <Route path="pelatihan" element={<PelatihanPage />} />
              <Route path="profil" element={<ProfilPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
