import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    ShieldCheck,
    FileText,
    TrendingUp,
    Download,
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';

export default function InsuranceModule() {
    const sensorLogs = useLiveQuery(() => db.sensorLogs.toArray()) || [];
    const triviaProgress = useLiveQuery(() => db.podcasts_progress.where('status').equals('completado').toArray()) || [];

    // Lógica de cálculo Pro: Penalización por eventos + Bono por Capacitación
    const criticalEvents = sensorLogs.filter(log =>
        ['Giro Brusco', 'Frenado Brusco', 'Fatiga', 'Celular'].includes(log.road_event)
    ).length;

    const triviaBonus = Math.min(10, triviaProgress.length * 2); // Hasta 10 puntos de bono por aprender
    const rawScore = 100 - (criticalEvents * 3) + triviaBonus;
    const safetyScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const getStatusColor = (score) => {
        if (score >= 85) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Certificación Rímac Seguros</h2>
                    <p className="text-slate-500 text-sm">Validación técnica para pólizas de flota Transervis.</p>
                </div>
                <div className="flex flex-col items-end">
                    <ShieldCheck size={32} className="text-red-500" />
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter mt-1">Socio Estratégico</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Safety Index Certificado</p>
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        {/* SVG Circle Progress */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-slate-800"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * safetyScore) / 100}
                                className={getStatusColor(safetyScore)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className={`absolute text-4xl font-black ${getStatusColor(safetyScore)}`}>
                            {safetyScore}
                        </span>
                    </div>
                    <p className="mt-6 text-sm font-medium text-slate-300">
                        Puntaje basado en {totalAlerts} eventos de telemetría analizados.
                    </p>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-blue-400" /> Historial de Certificaciones
                        </h3>
                        <div className="space-y-3">
                            {[
                                { date: '01 Feb 2026', score: 92, broker: 'Rimac Seguros', status: 'Aprobado' },
                                { date: '15 Ene 2026', score: 88, broker: 'Pacifico', status: 'Aprobado' }
                            ].map((cert, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-bold">{cert.broker}</p>
                                            <p className="text-[10px] text-slate-500">{cert.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">{cert.score} pts</p>
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase">{cert.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <TrendingUp size={48} />
                            </div>
                            <h4 className="text-sm font-bold text-emerald-400">Descuento Proyectado Rímac</h4>
                            <p className="text-2xl font-black text-white">$145.50 / mes</p>
                            <p className="text-[10px] text-emerald-500/70 font-medium tracking-wide">
                                {triviaBonus > 0 ? `Bono de capacitación (+${triviaBonus} pts) aplicado.` : 'Capacítate para aumentar tu descuento.'}
                            </p>
                        </div>
                        <button className="bg-red-600 hover:bg-red-500 text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group border border-red-400/30">
                            <Download className="group-hover:animate-bounce" />
                            <span className="font-bold text-sm">Descargar Reporte Rímac</span>
                            <span className="text-[10px] opacity-70">PDF con Firma Digital Aris Ethics</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 bg-slate-900/30 border-dashed border-red-500/20">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold">Convenio de Privacidad Rímac - LogTech</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Certificado emitido bajo los estándares de **Safety Analytics** de Aris. Este documento tiene validez legal para la renegociación de primas de flota ante **Rímac Seguros y Reaseguros**, siempre que el hash de integridad SHA-256 sea validado en el portal de Aris Ethics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
