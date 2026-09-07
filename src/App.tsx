import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './features/HomePage';
import FamilyPage from './features/input/FamilyPage';
import PropertiesPage from './features/properties/PropertiesPage';
import PropertyDetailPage from './features/properties/PropertyDetailPage';
import ImportPage from './features/import/ImportPage';
import BenefitsPage from './features/benefits/BenefitsPage';
import FinancePage from './features/finance/FinancePage';
import ComparePage from './features/compare/ComparePage';
import RentVsBuyPage from './features/finance/RentVsBuyPage';

const nav = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/family', label: 'Семья и бюджет' },
  { to: '/properties', label: 'Объекты' },
  { to: '/import', label: 'Импорт' },
  { to: '/benefits', label: 'Справочник льгот' },
  { to: '/finance', label: 'Финплан' },
  { to: '/rent-vs-buy', label: 'Аренда vs ипотека' },
  { to: '/compare', label: 'Сравнение' },
];

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span className="font-semibold text-slate-800">Подбор жилья · семейный помощник</span>
          </div>
          <span className="text-xs text-slate-400">Приватный сервис · данные хранятся только в этом браузере</span>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 pb-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/benefits" element={<BenefitsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/rent-vs-buy" element={<RentVsBuyPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        Не является юридической консультацией. Проверяйте актуальные условия в банке / МФЦ / СФР.
      </footer>
    </div>
  );
}
