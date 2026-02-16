import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from './db';
import LiquidationModule from './modules/LiquidationModule';
import DashboardModule from './modules/DashboardModule';
import SafetyModule from './modules/SafetyModule';
import ContactsModule from './modules/ContactsModule';
import FeatureCenter from './modules/FeatureCenter';
import PodcastModule from './modules/PodcastModule';
import InsuranceModule from './modules/InsuranceModule';
import InteractiveModule from './modules/InteractiveModule';
import SettingsModule from './modules/SettingsModule';
import Logo from './components/Logo';
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
  Database,
  Phone,
  Wifi,
  WifiOff,
  Headphones,
  ShieldCheck,
  Gamepad2
} from 'lucide-react';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userRole, setUserRole] = useState('admin');
  const [vehicleType, setVehicleType] = useState('truck');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const features = useLiveQuery(() => db.features.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toArray()) || [];
  const isFeatureEnabled = (id) => features.find(f => f.id === id)?.is_enabled;
  const getSetting = (id, fallback) => settings.find(s => s.id === id)?.value || fallback;

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`glass border-r border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <Logo size={32} className={!isSidebarOpen ? "hidden" : ""} />
          {!isSidebarOpen && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">L</div>}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`flex flex-col gap-8 p-6 overflow-y-auto ${!isSidebarOpen ? 'items-center' : ''}`}>
          {/* Vehicle Switcher */}
          <div className={`flex gap-2 p-2 bg-slate-900/50 rounded-xl ${!isSidebarOpen && 'flex-col'}`}>
            <button
              onClick={() => setVehicleType('truck')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-all ${vehicleType === 'truck' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              title="Modo Camión"
            >
              <Truck size={16} />
              {isSidebarOpen && <span className="text-[10px] font-bold uppercase">Camión</span>}
            </button>
            <button
              onClick={() => setVehicleType('moto')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-all ${vehicleType === 'moto' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              title="Modo Motorista"
            >
              <Bike size={16} />
              {isSidebarOpen && <span className="text-[10px] font-bold uppercase">Moto</span>}
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {isSidebarOpen && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Menú Principal</p>}
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              collapsed={!isSidebarOpen}
            />
            <NavItem
              icon={<Wallet size={20} />}
              label="Liquidación"
              active={activeTab === 'finance'}
              onClick={() => setActiveTab('finance')}
              collapsed={!isSidebarOpen}
            />
            <NavItem
              icon={<ShieldAlert size={20} />}
              label="SST & Seguridad"
              active={activeTab === 'safety'}
              onClick={() => setActiveTab('safety')}
              collapsed={!isSidebarOpen}
            />
            {isFeatureEnabled('podcast_edu') && (
              <NavItem
                icon={<Headphones size={20} />}
                label="Capsulas Audio"
                active={activeTab === 'podcast'}
                onClick={() => setActiveTab('podcast')}
                collapsed={!isSidebarOpen}
              />
            )}
            {isFeatureEnabled('gamification') && (
              <NavItem
                icon={<Gamepad2 size={20} />}
                label="Aris Interactiva"
                active={activeTab === 'interactive'}
                onClick={() => setActiveTab('interactive')}
                collapsed={!isSidebarOpen}
              />
            )}
            <NavItem
              icon={<Phone size={20} />}
              label="Directorio"
              active={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
              collapsed={!isSidebarOpen}
            />
            {isFeatureEnabled('auditor') && (
              <NavItem
                icon={<Database size={20} />}
                label="Auditoría"
                active={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
                collapsed={!isSidebarOpen}
              />
            )}
            {isFeatureEnabled('insurance_pro') && (
              <NavItem
                icon={<ShieldCheck size={20} />}
                label="Seguros UBI"
                active={activeTab === 'insurance'}
                onClick={() => setActiveTab('insurance')}
                collapsed={!isSidebarOpen}
              />
            )}
            <NavItem
              icon={<Settings size={20} />}
              label="Escalabilidad"
              active={activeTab === 'features'}
              onClick={() => setActiveTab('features')}
              collapsed={!isSidebarOpen}
            />
            <NavItem
              icon={<Settings size={20} />}
              label="Configuración"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              collapsed={!isSidebarOpen}
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <UserProfile
              collapsed={!isSidebarOpen}
              adminName={getSetting('admin_name', 'Administrador')}
              companyName={getSetting('company_name', 'Empresa Configurada')}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-8 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {activeTab === 'dashboard' && 'Panel de Control'}
              {activeTab === 'finance' && 'Gestión de Gastos'}
              {activeTab === 'safety' && 'Seguridad Vial & SST'}
              {activeTab === 'settings' && 'Configuración de Sistema'}
              {activeTab === 'contacts' && 'Directorio de Contactos'}
              {activeTab === 'features' && 'Escalabilidad Modular'}
              {activeTab === 'audit' && 'Auditoría del Sistema'}
              {activeTab === 'podcast' && 'Aris Audio: Capacitación'}
              {activeTab === 'insurance' && 'Certificación de Seguros Aris'}
              {activeTab === 'interactive' && 'Aris Interactiva'}
            </h2>
            <p className="text-slate-400 text-sm">Martes, 10 de Febrero 2026</p>
          </div>

          <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'} flex items-center gap-2`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'En Línea' : 'Modo Offline'}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4">
          {activeTab === 'dashboard' && <DashboardModule role={userRole} vehicleType={vehicleType} />}
          {activeTab === 'finance' && <LiquidationModule />}
          {activeTab === 'safety' && <SafetyModule vehicleType={vehicleType} />}
          {activeTab === 'contacts' && <ContactsModule />}
          {activeTab === 'features' && <FeatureCenter />}
          {activeTab === 'podcast' && <PodcastModule onExit={() => setActiveTab('dashboard')} />}
          {activeTab === 'insurance' && <InsuranceModule />}
          {activeTab === 'interactive' && <InteractiveModule onExit={() => setActiveTab('dashboard')} />}
          {activeTab === 'settings' && <SettingsModule />}

          {/* Placeholder for settings / audit if not fully implemented */}
          {(activeTab === 'settings' || activeTab === 'audit') && (
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

function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      title={collapsed ? label : ""}
    >
      <div className="flex items-center gap-3">
        {icon}
        {!collapsed && <span className="font-medium text-sm">{label}</span>}
      </div>
      {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_white]"></div>}
    </button>
  );
}

function UserProfile({ collapsed, adminName, companyName }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 shrink-0">
        <UserIcon size={20} />
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold truncate">{adminName}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{companyName}</p>
        </div>
      )}
      {!collapsed && (
        <button className="text-slate-500 hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}
