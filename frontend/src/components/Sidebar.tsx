import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  Sliders,
  Menu,
  X,
} from 'lucide-react'
import AvisoEtico from './AvisoEtico'

const NAV_ITEMS = [
  { to: '/resumen', label: 'Resumen', icon: LayoutDashboard },
  { to: '/alumnos', label: 'Alumnos en riesgo', icon: Users },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/modelos', label: 'Modelos', icon: BarChart2 },
  { to: '/simulador', label: 'Simulador', icon: Sliders },
]

function NavItems({ onClose }: { onClose?: () => void }) {
  return (
    <nav aria-label="Navegación principal">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Sidebar completa — solo visible en md+ */
export function SidebarDesktop() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-4 border-r border-slate-200 bg-slate-100 px-4 py-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Panel de Alerta
        </p>
        <h1 className="text-base font-semibold text-slate-800 leading-tight">
          Deserción en Enfermería
        </h1>
        <p className="text-xs text-slate-500">UniPamplona</p>
      </div>
      <NavItems />
      <div className="mt-auto">
        <AvisoEtico />
      </div>
    </aside>
  )
}

/** Barra superior con menú hamburguesa — solo visible en móvil (< md) */
export function TopbarMobile() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      {/* Barra superior */}
      <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3">
        <span className="text-sm font-semibold font-heading text-slate-800">Panel de Alerta · Enfermería</span>
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="rounded p-1 text-slate-600 hover:bg-slate-200"
        >
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Cajón de navegación */}
      {abierto && (
        <div className="md:hidden border-b border-slate-200 bg-slate-50 px-4 py-4 flex flex-col gap-4">
          <NavItems onClose={() => setAbierto(false)} />
          <AvisoEtico />
        </div>
      )}
    </>
  )
}
