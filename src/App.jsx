import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from './db';
import LiquidationModule from './modules/LiquidationModule';
import SafetyModule from './modules/SafetyModule';
import DashboardModule from './modules/DashboardModule';
import ContactsModule from './modules/ContactsModule';
import FeatureCenter from './modules/FeatureCenter';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutDashboard,
  Truck,
  Bike,
  ShieldAlert,
  Wallet,
  Settings,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userRole, setUserRole] = useState('admin'); // Simulated role switch
  const [vehicleType, setVehicleType] = useState('truck'); // 'truck' o 'moto'
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const features = useLiveQuery(() => db.features.toArray()) || [];
  const isFeatureEnabled = (id) => features.find(f => f.id === id)?.is_enabled;

  useEffect(() => {
    seedDatabase();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-white">
      {/* Sidebar */}
      <nav className="w-full md:w-64 glass-card m-0 md:m-4 md:mr-0 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold brand-font tracking-tight">LogTech</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Fleet Intelligence</p>
          </div>
        </div>

        <div className="flex gap-2 p-2 bg-slate-900/50 rounded-xl mb-6">
          <button
            onClick={() => setVehicleType('truck')}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-all ${vehicleType === 'truck' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Truck size={16} />
            <span className="text-[10px] font-bold uppercase">Camión</span>
          </button>
          <button
            onClick={() => setVehicleType('moto')}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-all ${vehicleType === 'moto' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Bike size={16} />
            <span className="text-[10px] font-bold uppercase">Moto</span>
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Main Menu</p>
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<Wallet size={20} />}
            label="Liquidación"
            active={activeTab === 'finance'}
            onClick={() => setActiveTab('finance')}
          />
          <NavItem
            icon={<ShieldAlert size={20} />}
            label="SST & Seguridad"
            active={activeTab === 'safety'}
            onClick={() => setActiveTab('safety')}
          />
          <NavItem
            icon={<Phone size={20} />}
            label="Directorio"
            active={activeTab === 'contacts'}
            onClick={() => setActiveTab('contacts')}
          />
          {isFeatureEnabled('auditor') && (
            <NavItem
              icon={<Database size={20} />}
              label="Auditoría"
              active={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
            />
          )}
          <NavItem
            icon={<Settings size={20} />}
            label="Escalabilidad"
            active={activeTab === 'features'}
            onClick={() => setActiveTab('features')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Configuración"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Admin Usuario</p>
              <p className="text-xs text-slate-500">Transervis S.A.</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {activeTab === 'dashboard' && 'Control Panel'}
              {activeTab === 'finance' && 'Gestión de Gastos'}
              {activeTab === 'safety' && 'Seguridad Vial & SST'}
              {activeTab === 'settings' && 'Configuración de Sistema'}
            </h2>
            <p className="text-slate-400 text-sm">Martes, 10 de Febrero 2026</p>
          </div>

          <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'} flex items-center gap-2`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'En Línea' : 'Modo Offline'}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardModule role={userRole} vehicleType={vehicleType} />}
          {activeTab === 'finance' && <LiquidationModule />}
          {activeTab === 'safety' && <SafetyModule vehicleType={vehicleType} />}
          {activeTab === 'contacts' && <ContactsModule />}
          {activeTab === 'features' && <FeatureCenter />}
          {activeTab !== 'dashboard' && activeTab !== 'finance' && activeTab !== 'safety' && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Settings className="animate-spin-slow" />
              </div>
              <h3 className="text-lg font-semibold">Módulo en Desarrollo</h3>
              <p className="text-sm text-slate-400 max-w-xs">Estamos configurando los componentes para esta sección. Prueba el Dashboard primero.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_white]"></div>}
    </button>
  );
}


