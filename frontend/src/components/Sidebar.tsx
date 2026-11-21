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
      <ul className="flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado',
                  isActive
                    ? 'bg-unipamplona-rojo text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Sidebar completa — visible en pantallas md+ */
export function SidebarDesktop() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-4 border-r border-slate-200 bg-unipamplona-superficie px-4 py-5">
      {/* Cabecera con Logo Universidad de Pamplona sobre fondo blanco */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
          <img
            src="/logo-unipamplona.png"
            alt="Universidad de Pamplona"
            className="h-14 w-auto object-contain max-w-full"
          />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Facultad de Salud
          </span>
          <h1 className="text-base font-semibold font-heading text-slate-800 leading-tight">
            Deserción en Enfermería
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Semillero de Investigación</p>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex-1 pt-2">
        <NavItems />
      </div>

      {/* Aviso Ético Permanente al pie del menú */}
      <div className="mt-auto pt-2">
        <AvisoEtico />
      </div>
    </aside>
  )
}

/** Barra superior con menú hamburguesa — visible solo en móvil (< md) */
export function TopbarMobile() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-unipamplona-superficie px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Logo sobre fondo blanco sin deformar */}
          <div className="flex items-center justify-center rounded border border-slate-200 bg-white p-1 shadow-2xs">
            <img
              src="/logo-unipamplona.png"
              alt="Universidad de Pamplona"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <span className="text-sm font-semibold font-heading text-slate-800 block leading-tight">
              Alerta Temprana
            </span>
            <span className="text-[11px] text-slate-500 block">Enfermería · UniPamplona</span>
          </div>
        </div>

        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="rounded p-1.5 text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
        >
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Cajón desplegable móvil */}
      {abierto && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 flex flex-col gap-4 shadow-md">
          <NavItems onClose={() => setAbierto(false)} />
          <AvisoEtico />
        </div>
      )}
    </>
  )
}
