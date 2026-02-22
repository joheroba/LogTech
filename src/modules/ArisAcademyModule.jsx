import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
    GraduationCap,
    BookOpen,
    Shield,
    Zap,
    Layers,
    Award,
    ChevronRight,
    PlayCircle,
    Flame,
    Snowflake,
    Gem,
    Star
} from 'lucide-react';

export default function ArisAcademyModule() {
    const [view, setView] = useState('paths'); // 'paths', 'details', 'quiz'
    const assignment = useLiveQuery(() => db.assignments.orderBy('id').last());
    const loadType = assignment?.load_type || 'General';

    const paths = [
        {
            id: 'matpel',
            title: 'Especialista MATPEL',
            desc: 'Materiales Peligrosos y Emergencias',
            icon: <Flame className="text-orange-500" />,
            isPriority: loadType === 'Peligrosa',
            level: 'Novato'
        },
        {
            id: 'cold',
            title: 'Experto Cadena de Frío',
            desc: 'Mantenimiento de Temperatura',
            icon: <Snowflake className="text-blue-400" />,
            isPriority: loadType === 'Perecederos',
            level: 'Experto'
        },
        {
            id: 'safety',
            title: 'Seguridad Aris',
            desc: 'Conducción Defensiva y Fatiga',
            icon: <Shield className="text-emerald-500" />,
            isPriority: true,
            level: 'Mentor'
        },
        {
            id: 'mining',
            title: 'Operación Minera',
            desc: 'Protocolos de Altura y Socavón',
            icon: <Gem className="text-amber-500" />,
            isPriority: loadType === 'Minería',
            level: 'Novato'
        }
    ];

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10">
            {/* Header: User Mastery */}
            <div className="glass-card bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-10 border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <GraduationCap size={160} />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <Star size={40} className="text-white fill-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full border-2 border-slate-900 uppercase">
                            Mentor
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white">Aris Academy</h2>
                        <p className="text-indigo-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Certificado por: <span className="text-white font-bold">[SOCIO ACADÉMICO PENDIENTE]</span></p>
                        <div className="flex gap-4 mt-4">
                            <Badge label="12 Cápsulas" icon={<BookOpen size={12} />} />
                            <Badge label="Level 45" icon={<Zap size={12} />} />
                            <Badge label="Certificado" icon={<Award size={12} />} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Load Recommendation */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
                        <Flame size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">Carga Detectada: {loadType}</h4>
                        <p className="text-xs text-slate-400">Aris recomienda priorizar la rama de <strong>MATPEL</strong> para esta ruta.</p>
                    </div>
                </div>
                <button className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95">
                    Ir a Especialidad
                </button>
            </div>

            {/* Learning Paths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paths.map(path => (
                    <div
                        key={path.id}
                        className={`glass-card p-6 flex items-center gap-6 hover:border-indigo-500/40 transition-all cursor-pointer group relative ${path.isPriority ? 'border-indigo-500/40' : ''}`}
                    >
                        {path.isPriority && <div className="absolute top-4 right-4 text-[8px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">Sugerido</div>}

                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                            {path.icon}
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{path.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{path.desc}</p>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{path.level}</div>
                                <div className="h-1 bg-slate-800 flex-1 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full w-2/3"></div>
                                </div>
                            </div>
                        </div>

                        <ChevronRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Resume Current Action */}
            <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-l-indigo-600 bg-indigo-600/5">
                <div className="flex items-center gap-6">
                    <PlayCircle size={48} className="text-indigo-400 animate-pulse" />
                    <div>
                        <h4 className="text-xl font-bold text-white uppercase tracking-tighter">Próxima Lección: Frenado en Altura</h4>
                        <p className="text-sm text-slate-400 italic">"Para ser Mentor, necesitas completar este reto técnico."</p>
                    </div>
                </div>
                <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 uppercase text-xs">Continuar Aprendizaje</button>
            </div>
        </div>
    );
}

function Badge({ label, icon }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700 text-[10px] font-bold text-slate-300">
            {icon}
            {label}
        </div>
    );
}
