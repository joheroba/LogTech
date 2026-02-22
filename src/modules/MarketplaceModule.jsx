import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
    Gem,
    ShoppingCart,
    Truck,
    Bike,
    Wifi,
    ShieldPlus,
    Coffee,
    Award,
    TrendingUp,
    CheckCircle2,
    Clock
} from 'lucide-react';

export default function MarketplaceModule() {
    const sensorLogs = useLiveQuery(() => db.sensorLogs.toArray()) || [];
    const triviaProgress = useLiveQuery(() => db.podcasts_progress.where('status').equals('completado').toArray()) || [];

    // Cálculo de Tokens: Educación (2 c/u) + Seguridad (5 por jornada limpia)
    const educationTokens = triviaProgress.length * 2;
    const safetyTokens = Math.floor(sensorLogs.filter(log => log.road_event === 'Normal').length / 10) * 5;
    const totalTokens = educationTokens + safetyTokens;

    const [filter, setFilter] = useState('all');

    const rewards = [
        {
            id: 'sat-link',
            title: 'Bono Conectividad Satelital',
            description: 'Paquete de 5GB para zonas mineras sin cobertura.',
            cost: 50,
            category: 'heavy',
            icon: <Wifi className="text-blue-400" />
        },
        {
            id: 'ergo-pro',
            title: 'Cojín Ergonómico Lumbar',
            description: 'Especial para jornadas largas de conducción.',
            cost: 80,
            category: 'heavy',
            icon: <Truck className="text-amber-400" />
        },
        {
            id: 'life-ins',
            title: 'Seguro de Vida Plus',
            description: 'Cobertura ampliada para minería y altura.',
            cost: 150,
            category: 'heavy',
            icon: <ShieldPlus className="text-red-400" />
        },
        {
            id: 'rest-stop',
            title: 'Voucher Kit Descanso',
            description: 'Ducha + Almuerzo en Paradero Transervis.',
            cost: 30,
            category: 'heavy',
            icon: <Coffee className="text-emerald-400" />
        },
        {
            id: 'hazmat-cert',
            title: 'Beca Certificación MATPEL',
            description: 'Curso oficial para materiales peligrosos.',
            cost: 200,
            category: 'heavy',
            icon: <Award className="text-indigo-400" />
        },
        {
            id: 'oil-change',
            title: 'Cambio de Aceite Premium',
            description: 'Válido para minivan y autos particulares.',
            cost: 40,
            category: 'light',
            icon: <TrendingUp className="text-slate-400" />
        },
        {
            id: 'bike-mount',
            title: 'Soporte Anti-Vibración',
            description: 'Uso rudo para motocicletas de reparto.',
            cost: 25,
            category: 'light',
            icon: <Bike className="text-sky-400" />
        }
    ];

    const filteredRewards = filter === 'all'
        ? rewards
        : rewards.filter(r => r.category === filter);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header: Token Balance */}
            <div className="glass-card bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 flex items-center justify-between border-blue-500/30">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Gem className="text-blue-400 animate-pulse" />
                        Marketplace de Tokens
                    </h2>
                    <p className="text-blue-300/70 text-sm font-medium">Canjea tus méritos de seguridad y educación por beneficios reales.</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-white">{totalTokens}</span>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tokens Disponibles</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Por Educación"
                    value={`+${educationTokens}`}
                    sub="Trivias aprobadas"
                    icon={<Brain size={16} />}
                />
                <StatCard
                    label="Por Seguridad"
                    value={`+${safetyTokens}`}
                    sub="Manejo preventivo"
                    icon={<ShieldCheck size={16} />}
                />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterBtn>
                <FilterBtn active={filter === 'heavy'} onClick={() => setFilter('heavy')}>Minería & Carga</FilterBtn>
                <FilterBtn active={filter === 'light'} onClick={() => setFilter('light')}>Reparto & Ligeros</FilterBtn>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRewards.map(reward => (
                    <div key={reward.id} className="glass-card hover:border-blue-500/40 transition-all p-5 flex flex-col justify-between group">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                                {reward.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{reward.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{reward.description}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-1 text-blue-400 font-black">
                                <Gem size={14} />
                                <span>{reward.cost}</span>
                            </div>
                            <button
                                disabled={totalTokens < reward.cost}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${totalTokens >= reward.cost
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95'
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}
                            >
                                {totalTokens >= reward.cost ? 'Canjear Ahora' : 'Faltan Tokens'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon }) {
    return (
        <div className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div>
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{sub}</p>
            </div>
        </div>
    );
}

function FilterBtn({ children, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${active
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
        >
            {children}
        </button>
    );
}

function Brain({ size }) { return <Award size={size} />; }
function ShieldCheck({ size }) { return <CheckCircle2 size={size} />; }
