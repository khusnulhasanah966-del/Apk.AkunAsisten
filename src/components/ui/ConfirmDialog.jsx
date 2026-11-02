import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Hapus', confirmColor = 'bg-red-500 hover:bg-red-600' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{title || 'Konfirmasi'}</h3>
            <p className="text-gray-500 text-sm mt-1">{message || 'Apakah Anda yakin?'}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-colors ${confirmColor}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
