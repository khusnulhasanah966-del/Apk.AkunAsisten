import React from 'react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-4">
        {Icon && <Icon size={36} className="text-pink-400" />}
      </div>
      <h3 className="font-semibold text-gray-700 text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
