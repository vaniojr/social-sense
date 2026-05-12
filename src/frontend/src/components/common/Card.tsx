import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  actions,
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        shadow-sm hover:shadow-md transition-shadow
        overflow-hidden
        ${className}
      `}
    >
      {(title || subtitle || actions) && (
        <div className="border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
