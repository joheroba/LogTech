import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Truck,
    Shield,
    Map as MapIcon,
    User,
    Clock,
    Zap,
    Mic,
    Bike
} from 'lucide-react';

export default function DashboardModule({ role = 'admin', vehicleType = 'truck' }) {
    const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    const sensorLogs = useLiveQuery(() => db.sensorLogs.toArray()) || [];
    const roadAlerts = sensorLogs.filter(log => log.road_event.includes('Bache')).length;
    const telemetriaProAlerts = sensorLogs.filter(log => ['Frenado Brusco', 'Giro Brusco'].includes(log.road_event)).length;
    const fallAlerts = sensorLogs.filter(log => log.road_event === 'ALERTA DE CAÍDA').length;

    const vehicles = useLiveQuery(() => db.vehicles.toArray()) || [];
    const activeFleet = vehicles.length;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Fila de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Presupuesto Ejecutado"
                    value={`S/ ${totalExpenses.toLocaleString()}`}
                    sub="Basado en liquidaciones"
                    trend={totalExpenses > 5000 ? "+12%" : "-2%"}
                    trendUp={totalExpenses > 5000}
                    icon={<TrendingUp size={16} className="text-blue-400" />}
                />
                <StatCard
                    label={vehicleType === 'moto' ? "Alertas de Caída" : "Alertas Telemetría Pro"}
                    value={vehicleType === 'moto' ? fallAlerts.toString() : telemetriaProAlerts.toString()}
                    sub={vehicleType === 'moto' ? "Eventos detectados" : "Frenazos y giros bruscos"}
                    trend={vehicleType === 'moto' ? (fallAlerts > 0 ? "CRÍTICO" : "Seguro") : (telemetriaProAlerts > 5 ? "Atención" : "Seguro")}
                    trendUp={vehicleType === 'moto' ? fallAlerts > 0 : telemetriaProAlerts > 5}
                    icon={vehicleType === 'moto' ? <Bike size={16} className="text-rose-400" /> : <Zap size={16} className="text-amber-400" />}
                    color={vehicleType === 'moto' && fallAlerts > 0 ? "red" : "orange"}
                />
                <StatCard
                    label="Unidades Activas"
                    value={`${activeFleet}/30`}
                    sub="80% Disponibilidad"
                    trend="Estable"
                    icon={<Truck size={16} className="text-emerald-400" />}
                    color="green"
                />
                <StatCard
                    label="Índice de Seguridad"
                    value="96.8%"
                    sub="Basado en IA Vision Pro"
                    trend="+1.2%"
                    trendUp={true}
                    icon={<Shield size={16} className="text-blue-400" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mapa / Vista de Red */}
                <div className="lg:col-span-2 glass-card p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <MapIcon size={18} className="text-blue-400" />
                            Vista de Flota & Calidad de Vía
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                ● Vía Buena
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                ● Alerta Telemetría
                            </span>
                        </div>
                    </div>
                    <div className="w-full h-[350px] bg-slate-900/50 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        <p className="text-slate-500 text-[10px] italic z-10 text-center px-10">Mapeando {activeFleet} unidades, {roadAlerts} baches y {telemetriaProAlerts} eventos de telemetría pro.</p>
                        {/* Marcadores simulados */}
                        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_#ef4444]"></div>
                    </div>
                </div>

                {/* Actividad Reciente */}
                <div className="glass-card p-6 flex flex-col gap-5">
                    <h3 className="font-bold flex items-center gap-2">
                        <Clock size={18} className="text-blue-400" />
                        Registro de Eventos Pro
                    </h3>
                    <div className="flex flex-col gap-4">
                        {sensorLogs.slice(0, 5).map(log => (
                            <ActivityItem
                                key={log.id}
                                title={log.road_event}
                                desc={`Intensidad: ${log.intensity}G`}
                                time={new Date(log.timestamp).toLocaleTimeString()}
                                type={['Frenado Brusco', 'Giro Brusco'].includes(log.road_event) ? 'danger' : 'info'}
                            />
                        ))}
                        {sensorLogs.length === 0 && (
                            <p className="text-center text-slate-600 text-[10px] py-10 italic">No hay alertas de telemetría recientes.</p>
                        )}
                    </div>

                    <div className="mt-auto p-4 bg-blue-600/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Mic size={14} className="text-blue-400" />
                            <p className="text-[10px] font-bold uppercase">Estado Mecánico AI</p>
                        </div>
                        <p className="text-[10px] text-slate-400">Análisis espectral de motores activo. Salud de flota: 98%.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, trend, trendUp, icon, color = 'blue' }) {
    const colorMap = {
        blue: 'text-blue-400',
        green: 'text-emerald-400',
        orange: 'text-amber-400',
        red: 'text-rose-400'
    };

    return (
        <div className="glass-card p-5 group">
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trendUp ? 'text-amber-400' : 'text-slate-500'}`}>
                    {trend}
                </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <h4 className="text-2xl font-bold mt-1 tracking-tight">{value}</h4>
            <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
        </div>
    );
}

function ActivityItem({ title, desc, time, type }) {
    const dotColor = type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-blue-500';
    return (
        <div className={`flex gap-3 items-start border-l-2 border-slate-800 pl-4 relative before:absolute before:left-[-5px] before:top-0 before:w-2 before:h-2 before:rounded-full ${dotColor}`}>
            <div className="flex-1">
                <p className="text-[11px] font-bold">{title}</p>
                <p className="text-[9px] text-slate-500 truncate max-w-[150px]">{desc}</p>
            </div>
            <span className="text-[8px] text-slate-600 font-medium whitespace-nowrap">{time}</span>
        </div>
    );
}
