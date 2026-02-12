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

    // Lógica de cálculo de score de seguridad simplificada
    const totalAlerts = sensorLogs.length;
    const criticalEvents = sensorLogs.filter(log => ['Giro Brusco', 'Frenado Brusco', 'Fatiga'].includes(log.road_event)).length;

    const rawScore = 100 - (criticalEvents * 5);
    const safetyScore = Math.max(0, Math.min(100, rawScore));

    const getStatusColor = (score) => {
        if (score >= 85) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Certificación para Seguros</h2>
                    <p className="text-slate-500 text-sm">Valida tu historial de conducción para reducir primas.</p>
                </div>
                <ShieldCheck size={32} className="text-blue-500" />
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
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                            <TrendingUp className="text-emerald-500 mb-2" />
                            <h4 className="text-sm font-bold text-emerald-400">Ahorro Estimado</h4>
                            <p className="text-2xl font-black text-white">$120.00 / mes</p>
                            <p className="text-[10px] text-emerald-500/70 font-medium">Basado en tu Safety Score actual.</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group">
                            <Download className="group-hover:bounce" />
                            <span className="font-bold text-sm">Descargar Reporte Certificado</span>
                            <span className="text-[10px] opacity-70">Formato PDF firmado digitalmente</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 bg-slate-900/30 border-dashed">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold">Nota de Privacidad y Monetización</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Tus datos de telemetría solo se comparten con aseguradoras afiliadas si tú o tu administrador lo autoriza.
                            Mantener un score alto te permite acceder a beneficios de marketplace y descuentos exclusivos en repuestos Transervis S.A.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
