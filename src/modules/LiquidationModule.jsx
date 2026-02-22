import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Receipt,
    Plus,
    Trash2,
    Save,
    TrendingDown,
    CheckCircle,
    AlertCircle,
    Truck,
    CreditCard,
    MapPin,
    Camera,
    Image as ImageIcon,
    Fuel,
    Utensils,
    MoreHorizontal,
    FileText
} from 'lucide-react';
import VoiceButton from '../components/VoiceButton';
import useArisVoice from '../hooks/useArisVoice';

export default function LiquidationModule() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'Peaje',
        amount: '',
        description: '',
        vehicle_plate: 'ABC-123',
        photo: null // Base64 de la foto del comprobante
    });

    const { speak: arisSpeak } = useArisVoice();
    const latestAssignment = useLiveQuery(() => db.assignments.orderBy('id').last());

    const expenses = useLiveQuery(() => db.expenses.reverse().toArray()) || [];

    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const initialBudget = 500; // Mock initial budget

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return;

        await db.expenses.add({
            ...formData,
            amount: parseFloat(formData.amount),
            assignment_id: latestAssignment?.id || null,
            is_synced: 0,
            timestamp: Date.now()
        });

        setFormData({
            ...formData,
            amount: '',
            description: '',
            photo: null
        });
        setShowForm(false);
    };

    const handlePhotoCapture = () => {
        // Simulación de captura de cámara
        const mockPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        setFormData({ ...formData, photo: mockPhoto });
        arisSpeak("Comprobante capturado correctamente. Procesando imagen con IA.");
    };

    const handleCloseLiquidation = () => {
        const remaining = initialBudget - totalAmount;
        const message = `Aris dice: Has completado tu registro de gastos. Has utilizado S/ ${totalAmount.toFixed(2)} de un fondo de S/ ${initialBudget.toFixed(2)}. Te queda un saldo de S/ ${remaining.toFixed(2)} para el retorno. Buen trabajo.`;
        arisSpeak(message);
    };

    const deleteExpense = async (id) => {
        await db.expenses.delete(id);
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 border-l-4 border-blue-500">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fondo Inicial</p>
                    <h4 className="text-2xl font-bold">S/ {initialBudget.toFixed(2)}</h4>
                </div>
                <div className="glass-card p-5 border-l-4 border-amber-500">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Gasto Total</p>
                    <h4 className="text-2xl font-bold text-amber-400">S/ {totalAmount.toFixed(2)}</h4>
                </div>
                <div className="glass-card p-5 border-l-4 border-emerald-500">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Saldo Actual</p>
                    <h4 className="text-2xl font-bold text-emerald-400">S/ {(initialBudget - totalAmount).toFixed(2)}</h4>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Receipt size={24} className="text-blue-400" />
                    Registro de Gastos
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    Nuevo Gasto
                </button>
                <button
                    onClick={handleCloseLiquidation}
                    className="btn-secondary flex items-center gap-2 border-emerald-500/30 text-emerald-400"
                >
                    <FileText size={18} />
                    Cerrar Liquidación
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Column */}
                {showForm && (
                    <div className="lg:col-span-1 glass-card p-6 h-fit bg-blue-600/5 border-blue-500/30">
                        <h4 className="font-bold mb-4">Añadir Comprobante</h4>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                                <select
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Peaje">Peaje</option>
                                    <option value="Combustible">Combustible</option>
                                    <option value="Viaticos">Viáticos (Alimentación)</option>
                                    <option value="Cochera">Cochera / Parqueo</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Monto (S/)</label>
                                <input
                                    type="number"
                                    step="0.10"
                                    placeholder="0.00"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Descripción / Establecimiento</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ej: Peaje Chilca"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white flex-1"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    <VoiceButton onResult={(text) => setFormData({ ...formData, description: text })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 block mb-2">Comprobante / Foto</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePhotoCapture}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed transition-all ${formData.photo ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-500'
                                            }`}
                                    >
                                        {formData.photo ? <CheckCircle size={18} /> : <Camera size={18} />}
                                        <span className="text-xs font-bold">{formData.photo ? 'Foto Lista' : 'Capturar Recibo'}</span>
                                    </button>
                                    {formData.photo && (
                                        <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full justify-center mt-2">
                                <Save size={18} />
                                Guardar Localmente
                            </button>
                        </form>
                    </div>
                )}

                {/* List Column */}
                <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-3`}>
                    {expenses.length === 0 ? (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-center opacity-50">
                            <Receipt size={48} className="mb-4 text-slate-600" />
                            <p>No hay gastos registrados en este viaje.</p>
                            <p className="text-xs text-slate-500 mt-2">Usa el botón "Nuevo Gasto" para comenzar.</p>
                        </div>
                    ) : (
                        expenses.map(exp => (
                            <div key={exp.id} className="glass-card p-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exp.category === 'Peaje' ? 'bg-blue-500/20 text-blue-400' :
                                        exp.category === 'Combustible' ? 'bg-emerald-500/20 text-emerald-400' :
                                            exp.category === 'Viaticos' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {exp.category === 'Peaje' && <CreditCard size={20} />}
                                        {exp.category === 'Combustible' && <Fuel size={20} />}
                                        {exp.category === 'Viaticos' && <Utensils size={20} />}
                                        {(exp.category !== 'Peaje' && exp.category !== 'Combustible' && exp.category !== 'Viaticos') && <MoreHorizontal size={20} />}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm">{exp.description}</h5>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                                            {exp.category} • {exp.date}
                                            {exp.photo && <span className="ml-2 text-cyan-400">📷 Foto Incluida</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-bold text-lg">S/ {parseFloat(exp.amount).toFixed(2)}</p>
                                        {!exp.is_synced && (
                                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                Pendiente Sinc.
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteExpense(exp.id)}
                                        className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
