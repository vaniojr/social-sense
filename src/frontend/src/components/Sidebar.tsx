import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEntity } from '../context/EntityContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  submenu?: NavItem[];
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  {
    label: 'Análises',
    icon: '📈',
    path: '#',
    submenu: [
      { label: 'Tendências', path: '/trends', icon: '📉' },
      { label: 'Competição', path: '/competitors', icon: '👥' },
      { label: 'Geográfico', path: '/geo', icon: '🗺️' },
    ],
  },
  {
    label: 'Conteúdo',
    icon: '📰',
    path: '#',
    submenu: [
      { label: 'Notícias', path: '/news', icon: '📰' },
      { label: 'Monitoramento', path: '/monitor', icon: '👁️' },
    ],
  },
  {
    label: 'War Room',
    path: '/war-room',
    icon: '🎯',
  },
  {
    label: 'Cadastros',
    path: '/entities',
    icon: '📋',
  },
  { label: 'Configurações', path: '/settings', icon: '⚙️' },
];

interface NavItemProps {
  item: NavItem;
  isOpen: boolean;
  location: string;
  isCollapsed: boolean;
}

function NavItemComponent({ item, location, isCollapsed }: NavItemProps) {
  const [expandSubmenu, setExpandSubmenu] = useState(false);
  const isActive = location === item.path || (item.submenu?.some(sub => location === sub.path) ?? false);

  if (item.submenu) {
    return (
      <div key={item.label}>
        <button
          onClick={() => setExpandSubmenu(!expandSubmenu)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
            isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              <span className={`text-xs transition-transform ${expandSubmenu ? 'rotate-180' : ''}`}>▼</span>
            </>
          )}
        </button>
        {!isCollapsed && expandSubmenu && (
          <div className="bg-gray-50 ml-6 mt-1 rounded-md">
            {item.submenu.map(subitem => (
              <Link
                key={subitem.path}
                to={subitem.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                  location === subitem.path
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">{subitem.icon}</span>
                <span>{subitem.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      key={item.path}
      to={item.path}
      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
        isActive ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl">{item.icon}</span>
      {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { entities, selectedId, setSelectedId, loading } = useEntity();

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-lg font-bold text-gray-900">Social Sense</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title={isCollapsed ? 'Expandir' : 'Recolher'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Entity Selector */}
      <div className="px-4 py-3 border-b border-gray-200">
        {!isCollapsed && <label className="text-xs font-semibold text-gray-600 block mb-2">Entidade</label>}
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={loading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-colors ${
            isCollapsed ? 'hidden' : ''
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100`}
          title={selectedId && entities.find(e => e.id === selectedId)?.name}
        >
          {loading && <option>Carregando...</option>}
          {entities.map(entity => (
            <option key={entity.id} value={entity.id}>
              {entity.name} ({entity.type})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {navigationItems.map(item => (
          <NavItemComponent
            key={item.label}
            item={item}
            isOpen={true}
            location={location.pathname}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        {!isCollapsed && <p>v2.0</p>}
      </div>
    </aside>
  );
}
