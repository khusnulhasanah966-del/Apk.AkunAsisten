import React from 'react'

export default function LoadingSpinner({ size = 'md', text }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin`}></div>
      {text && <p className="text-pink-500 text-sm font-medium">{text}</p>}
    </div>
  )
}
