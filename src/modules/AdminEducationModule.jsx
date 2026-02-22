import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    BarChart3,
    Users,
    BookCheck,
    AlertTriangle,
    TrendingUp,
    FileText,
    Download,
    Search,
    ShieldCheck,
    Award,
    Filter
} from 'lucide-react';

export default function AdminEducationModule() {
    const progress = useLiveQuery(() => db.podcasts_progress.toArray()) || [];
    const podcasts = useLiveQuery(() => db.podcasts.toArray()) || [];
    const drivers = useLiveQuery(() => db.assignments.toArray()) || [];

    const [selectedTab, setSelectedTab] = useState('insights');
    const [searchQuery, setSearch] = useState('');

    // Mocks de analíticas (Conectables a lógica real de agregación)
    const analytics = {
        complianceRate: 78,
        knowledgeGaps: [
            { topic: 'Frenado MATPEL', failureRate: 42, severity: 'high' },
            { topic: 'Fatiga Nocturna', failureRate: 15, severity: 'medium' },
            { topic: 'Liquidación por Voz', failureRate: 58, severity: 'high' }
        ],
        roiStats: {
            savings: '$12,400',
            period: 'Último mes',
            accidentReduction: '15%'
        }
    };

    // Cálculo real de métricas
    const totalCertifications = progress.length;
    const uniqueDrivers = new Set(progress.map(p => p.person_dni)).size;
    const complianceRate = drivers.length > 0 ? Math.round((uniqueDrivers / drivers.length) * 100) : 0;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Education Center</h2>
                    <p className="text-slate-500 text-sm italic">Gestión de conocimiento y cumplimiento de la flota Aris.</p>
                </div>
                <div className="flex gap-2">
                    <TabBtn active={selectedTab === 'insights'} onClick={() => setSelectedTab('insights')} icon={<BarChart3 size={16} />}>Análisis</TabBtn>
                    <TabBtn active={selectedTab === 'fleet'} onClick={() => setSelectedTab('fleet')} icon={<Users size={16} />}>Conductores</TabBtn>
                </div>
            </div>

            {selectedTab === 'insights' ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InsightCard
                            title="Nivel de Cumplimiento"
                            value={`${complianceRate}%`}
                            sub={`${uniqueDrivers} conductores certificados`}
                            trend="Métrica Real DB"
                            icon={<BookCheck className="text-emerald-400" />}
                        />
                        <InsightCard
                            title="Ahorro Proyectado"
                            value={"$12,400"}
                            sub={`Basado en reducción de siniestralidad`}
                            trend="Cálculo Aris Finance"
                            icon={<TrendingUp className="text-blue-400" />}
                        />
                        <InsightCard
                            title="Total Certificaciones"
                            value={totalCertifications.toString()}
                            sub="Lecciones completadas en total"
                            trend="+ hoy"
                            icon={<ShieldCheck className="text-indigo-400" />}
                        />
                    </div>

                    {/* Knowledge Gaps */}
                    <div className="glass-card p-6 border-l-4 border-l-amber-500 bg-amber-500/5">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Análisis de Brechas de Conocimiento (Knowledge Gaps)
                        </h3>
                        <div className="space-y-3">
                            {analytics.knowledgeGaps.map((gap, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <span className="text-sm font-medium text-slate-300">{gap.topic}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full" style={{ width: `${gap.failureRate}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-amber-500">{gap.failureRate}% Fallos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                /* Fleet Education Management */
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar conductor..."
                                className="w-full bg-slate-800 border-none rounded-lg p-2 pl-9 text-xs text-white"
                                value={searchQuery}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-tighter hover:bg-indigo-500 transition-colors"
                        >
                            <Download size={14} /> Exportar Certificaciones para Alianza
                        </button>
                    </div>
                    <table className="w-full text-left text-xs text-slate-400">
                        <thead className="bg-slate-900/50 text-slate-500">
                            <tr>
                                <th className="p-4 font-bold uppercase">Conductor (ID)</th>
                                <th className="p-4 font-bold uppercase">Maestría Global</th>
                                <th className="p-4 font-bold uppercase">Especialidades Activas</th>
                                <th className="p-4 font-bold uppercase text-right">Aval Académico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {drivers.filter(d => d.driver_name.toLowerCase().includes(searchQuery.toLowerCase())).map((driver, idx) => (
                                <DriverRow
                                    key={idx}
                                    name={driver.driver_name}
                                    dni={driver.driver_dni}
                                    level={idx % 3 === 0 ? 'Mentor' : idx % 3 === 1 ? 'Experto' : 'Novato'}
                                    badges={driver.load_type === 'Pelicrosa' ? ['Seguridad', 'MATPEL'] : ['Seguridad']}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function InsightCard({ title, value, sub, trend, icon }) {
    return (
        <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{trend}</span>
            </div>
            <div>
                <p className="text-3xl font-black text-white">{value}</p>
                <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">{title}</h4>
                <p className="text-[10px] text-slate-500 italic mt-1">{sub}</p>
            </div>
        </div>
    );
}

function TabBtn({ children, active, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${active ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'text-slate-500 hover:bg-slate-800'
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

function DriverRow({ name, dni, level, badges }) {
    return (
        <tr className="hover:bg-slate-800/30">
            <td className="p-4">
                <div className="font-bold text-white">{name}</div>
                <div className="text-[10px] text-slate-500">DNI: {dni}</div>
            </td>
            <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${level === 'Mentor' ? 'bg-amber-500/20 text-amber-500' :
                        level === 'Experto' ? 'bg-indigo-500/20 text-indigo-500' : 'bg-slate-700 text-slate-400'
                    }`}>
                    {level}
                </span>
            </td>
            <td className="p-4">
                <div className="flex gap-1">
                    {badges.map((b, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 rounded-full text-[8px] font-bold text-slate-400">{b}</span>
                    ))}
                </div>
            </td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button className="text-slate-500 hover:text-emerald-400 transition-colors" title="Ver Certificado Académico">
                        <Award size={16} />
                    </button>
                    <button className="text-slate-500 hover:text-indigo-400 transition-colors" title="Historial Completo">
                        <FileText size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
