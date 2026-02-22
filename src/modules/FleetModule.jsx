import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Users,
    Truck,
    UserPlus,
    CheckCircle,
    Search,
    MapPin,
    Calendar,
    ShieldCheck,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import useArisVoice from '../hooks/useArisVoice';

export default function FleetModule() {
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [selectedHelper, setSelectedHelper] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const { speak: arisSpeak } = useArisVoice();

    const vehicles = useLiveQuery(() => db.vehicles.toArray()) || [];
    const personnel = useLiveQuery(() => db.personnel.toArray()) || [];

    const filteredPersonnel = personnel.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
    );

    const handleAssign = async () => {
        if (!selectedVehicle || !selectedDriver) {
            arisSpeak("Por favor, selecciona al menos un vehículo y un conductor principal.");
            return;
        }

        const assignment = {
            vehicle_id: selectedVehicle.id,
            driver_dni: selectedDriver.dni,
            helper_dni: selectedHelper?.dni || null,
            assigned_at: Date.now(),
            status: 'activo'
        };

        // Guardar asignación real en la DB
        await db.assignments.add(assignment);

        // Actualizar el vehículo con la tripulación actual para acceso rápido
        await db.vehicles.update(selectedVehicle.id, {
            current_driver_dni: selectedDriver.dni,
            current_helper_dni: selectedHelper?.dni || null
        });

        arisSpeak(`Asignación completada. Unidad ${selectedVehicle.plate} vinculada a ${selectedDriver.name}${selectedHelper ? ' y ' + selectedHelper.name : ''}. Generando Admin-Sync.`);

        setCurrentStep(3); // Mostrar confirmación
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users size={24} className="text-blue-400" />
                        Centro de Asignación de Flota
                    </h2>
                    <p className="text-slate-400 text-xs">Vinculación de tripulación e inteligencia de cabina.</p>
                </div>
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(step => (
                        <div
                            key={step}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                                }`}
                        >
                            {step < currentStep ? <CheckCircle size={14} /> : step}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Paso 1: Selección de Vehículo */}
                <div className={`lg:col-span-1 glass-card p-6 flex flex-col gap-4 ${currentStep !== 1 && 'opacity-50 pointer-events-none'}`}>
                    <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-500">
                        <Truck size={18} />
                        1. Seleccionar Unidad
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                        {vehicles.map(v => (
                            <button
                                key={v.id}
                                onClick={() => { setSelectedVehicle(v); setCurrentStep(2); }}
                                className={`p-4 rounded-xl border transition-all text-left flex justify-between items-center ${selectedVehicle?.id === v.id
                                    ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div>
                                    <p className="text-sm font-bold">{v.plate}</p>
                                    <p className="text-[10px] text-slate-500">{v.model}</p>
                                </div>
                                <ArrowRight size={16} className={selectedVehicle?.id === v.id ? 'text-blue-400' : 'text-slate-700'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Paso 2: Selección de Tripulación */}
                <div className={`lg:col-span-2 glass-card p-6 flex flex-col gap-4 ${currentStep !== 2 && 'opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-500">
                            <UserPlus size={18} />
                            2. Configurar Tripulación
                        </h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar por DNI o Nombre..."
                                className="input-field pl-10 text-xs py-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selector de Conductor */}
                        <div className="flex flex-col gap-3">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Conductor Titular</p>
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                                {filteredPersonnel.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedDriver(p)}
                                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedDriver?.id === p.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{p.name}</p>
                                            <p className="text-[9px] text-slate-500">DNI: {p.dni}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selector de Copiloto/Ayudante */}
                        <div className="flex flex-col gap-3">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Ayudante / Copiloto</p>
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                                {filteredPersonnel.filter(p => p.id !== selectedDriver?.id).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedHelper(p)}
                                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedHelper?.id === p.id ? 'bg-emerald-600/10 border-emerald-500' : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{p.name}</p>
                                            <p className="text-[9px] text-slate-500">DNI: {p.dni}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                        <button onClick={() => setCurrentStep(1)} className="text-slate-500 text-xs hover:text-slate-300">Volver a selección de unidad</button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedVehicle || !selectedDriver}
                            className="btn-primary"
                        >
                            Confirmar Asignación de Tripulación
                        </button>
                    </div>
                </div>

                {/* Resumen Final / Éxito */}
                {currentStep === 3 && (
                    <div className="lg:col-span-3 glass-card p-12 flex flex-col items-center justify-center text-center gap-6 animate-scale-in">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border-2 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">¡Tripulación Sincronizada!</h3>
                            <p className="text-slate-400 max-w-md mx-auto mt-2">
                                La unidad **{selectedVehicle.plate}** ha sido vinculada correctamente.
                                Aris iniciará la validación facial en cuanto se detecte movimiento.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Conductor</p>
                                <p className="text-sm font-bold">{selectedDriver.name}</p>
                            </div>
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Ayudante</p>
                                <p className="text-sm font-bold">{selectedHelper?.name || 'Ninguno'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setCurrentStep(1); setSelectedVehicle(null); setSelectedDriver(null); setSelectedHelper(null); }}
                            className="btn-secondary"
                        >
                            Crear Nueva Asignación
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
