import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Settings,
    Info,
    ToggleLeft,
    ToggleRight,
    AlertCircle,
    TrendingUp,
    ShieldCheck,
    Zap
} from 'lucide-react';

export default function FeatureCenter() {
    const features = useLiveQuery(() => db.features.toArray()) || [];

    const toggleFeature = async (id, currentState) => {
        await db.features.update(id, { is_enabled: !currentState });
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Centro de Funciones y Escalabilidad</h2>
                    <p className="text-slate-500 text-sm">Activa módulos avanzados según crezca tu operación.</p>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Settings size={14} /> Configuración de Flota
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map(feature => (
                    <div key={feature.id} className={`glass-card p-6 border transition-all ${feature.is_enabled ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${feature.is_enabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {feature.id === 'telemetry_pro' && <Zap size={20} />}
                                    {feature.id === 'attendance' && <ShieldCheck size={20} />}
                                    {feature.id === 'bonuses' && <TrendingUp size={20} />}
                                    {feature.id === 'auditor' && <Settings size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{feature.name}</h3>
                                    <p className="text-xs text-slate-500">{feature.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleFeature(feature.id, feature.is_enabled)}
                                className={`transition-colors ${feature.is_enabled ? 'text-blue-500' : 'text-slate-600'}`}
                            >
                                {feature.is_enabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800/50">
                            <div className="flex gap-3">
                                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Impacto Operativo</p>
                                    <p className="text-xs text-slate-500 italic leading-relaxed">{feature.impact}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-amber-400/80 uppercase mb-1">Guía del Administrador</p>
                                    <p className="text-xs font-medium text-slate-300">{feature.recommendation}</p>
                                </div>
                            </div>
                        </div>

                        {feature.is_enabled && (
                            <div className="mt-4 animate-slide-up">
                                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase justify-center border border-emerald-500/20">
                                    Módulo Activo y Optimizado
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="glass-card p-8 text-center bg-slate-900/20 border-dashed">
                <h4 className="font-bold mb-2">¿Necesitas una función personalizada?</h4>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                    Como administrador principal, puedes gestionar tu flota de forma individual o delegar el control a supervisores especializados según aumente tu volumen de carga.
                </p>
            </div>
        </div>
    );
}
