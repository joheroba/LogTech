import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Scale,
    ShieldCheck,
    FileAudio,
    Hash,
    AlertCircle,
    User,
    Calendar,
    ChevronRight,
    CheckCircle2,
    XCircle,
    TrendingDown,
    Activity
} from 'lucide-react';

export default function AuditorModule() {
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Simulación de eventos con apelaciones pendientes
    const events = useLiveQuery(() => db.sensorLogs.where('road_event').notEqual('').toArray()) || [];

    const handleAction = async (id, action) => {
        // En una app real, esto actualizaría el estado de la apelación en la DB
        console.log(`Evento ${id} marcado como ${action}`);
        setSelectedEvent(null);
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Centro de Auditoría Aris</h2>
                    <p className="text-slate-500 text-sm">Contraste de evidencias y resolución de apelaciones.</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
                    <Scale size={24} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Lista de Eventos */}
                <div className="xl:col-span-4 glass-card overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Casos Pendientes</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 h-[600px] custom-scrollbar">
                        {events.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 italic">No hay casos pendientes de revisión.</div>
                        ) : (
                            events.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`w-full p-4 border-b border-slate-800/50 text-left transition-all hover:bg-slate-800/30 flex items-center justify-between group ${selectedEvent?.id === event.id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${event.road_event.includes('Frenado') ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            <AlertCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{event.road_event}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">{new Date(event.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-600 group-hover:text-indigo-400 transition-colors ${selectedEvent?.id === event.id ? 'text-indigo-500' : ''}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detalle del Caso (Evidencias) */}
                <div className="xl:col-span-8 flex flex-col gap-6 h-full">
                    {selectedEvent ? (
                        <>
                            <div className="glass-card p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Revision de Incidente: {selectedEvent.road_event}</h3>
                                            <p className="text-xs text-slate-500">Conductor: Juan Perez (DNI: 12345678)</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30 uppercase">En Apelación</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Evidencia 1: Audio/Voz */}
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-3 text-cyan-400">
                                            <FileAudio size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Descargo de Voz</span>
                                        </div>
                                        <p className="text-xs text-slate-300 italic leading-relaxed">
                                            "Aris, apelo este evento. Tuve que frenar porque un peatón cruzó sin mirar. No fue imprudencia."
                                        </p>
                                        <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 w-3/4 animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Evidencia 2: Telemetría */}
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-3 text-red-400">
                                            <Activity size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Datos Sensores</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-500">G-Force Y:</span>
                                                <span className="text-white font-mono">-4.8g</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-500">Velocidad:</span>
                                                <span className="text-white font-mono">42 km/h</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-500">Freno Progresivo:</span>
                                                <span className="text-emerald-400 font-bold uppercase">No</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evidencia 3: Integridad */}
                                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                            <ShieldCheck size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Firma Digital</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold">
                                                <CheckCircle2 size={12} />
                                                Integridad Verificada
                                            </div>
                                            <div className="p-2 bg-black/40 rounded border border-slate-800 font-mono text-[8px] text-slate-500 break-all leading-tight">
                                                SHA-256: 8f2d9a3b...e4f1c7
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones del Auditor */}
                                <div className="flex gap-4 mt-4 pt-6 border-t border-slate-800">
                                    <button
                                        onClick={() => handleAction(selectedEvent.id, 'ACEPTADO')}
                                        className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-500 justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                    >
                                        <CheckCircle2 size={18} />
                                        Validar Descargo
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedEvent.id, 'RECHAZADO')}
                                        className="flex-1 btn-secondary border-rose-500/30 text-rose-400 hover:bg-rose-500/10 justify-center"
                                    >
                                        <XCircle size={18} />
                                        Mantener Alerta
                                    </button>
                                </div>
                            </div>

                            {/* Insight de IA */}
                            <div className="glass-card p-6 border-l-4 border-indigo-500 bg-indigo-500/5">
                                <div className="flex gap-4">
                                    <BrainCircuit className="text-indigo-400 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm text-indigo-300">Análisis Asistido por Aris</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            He contrastado el análisis acústico de cabina con la telemetría. Se detectó un patrón reactivo de alta frecuencia sugerente de frenado de emergencia genuino. El hash de evidencia confirma que no hubo manipulación de los logs. **Recomiendo validar el descargo.**
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500 border-dashed border-2">
                            <Scale size={64} className="mb-6 opacity-10" />
                            <p className="text-lg font-medium">Seleccione un caso de la lista para auditar las evidencias.</p>
                            <p className="text-sm max-w-xs mt-2">Aris Ethics garantiza que todas las apelaciones sean revisadas con datos inalterables.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
