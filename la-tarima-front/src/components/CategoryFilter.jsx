import { LayoutGrid, Wine, Beer, Flame, GlassWater, Star, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = [
  { key: 'todos',          label: 'Todos',          icon: LayoutGrid },
  { key: 'coctel',         label: 'Cócteles',       icon: Wine },
  { key: 'cerveza',        label: 'Cervezas',       icon: Beer },
  { key: 'licor',          label: 'Licores',        icon: Flame },
  { key: 'vino',           label: 'Vinos',          icon: GlassWater },
  { key: 'snack',          label: 'Snacks',         icon: Star },
  { key: 'entradas',       label: 'Entradas',       icon: Star },
  { key: 'platos_fuertes', label: 'Platos fuertes', icon: Star },
  { key: 'especialidades', label: 'Especialidades', icon: Star },
  { key: 'otro',           label: 'Otros',          icon: Star },
]

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="category-filter">
      {CATEGORIES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`cat-btn${active === key ? ' active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
      <button className="cat-btn" style={{ marginLeft: 'auto' }}>
        <SlidersHorizontal size={14} />
      </button>
    </div>
  )
}
