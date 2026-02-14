import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Building2, User, Save, ShieldCheck } from 'lucide-react';

export default function SettingsModule() {
    const settings = useLiveQuery(() => db.settings.toArray()) || [];
    const [isSaving, setIsSaving] = useState(false);

    const getSetting = (id) => settings.find(s => s.id === id)?.value || '';

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData(e.target);
        const updates = [
            { id: 'company_name', value: formData.get('company_name') },
            { id: 'company_ruc', value: formData.get('company_ruc') },
            { id: 'admin_name', value: formData.get('admin_name') }
        ];

        try {
            for (const update of updates) {
                await db.settings.update(update.id, { value: update.value });
            }
            alert('Configuración guardada exitosamente en ArisDB local.');
        } catch (error) {
            console.error('Error guardando ajustes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                        <Building2 className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Configuración de Organización</h3>
                        <p className="text-sm text-slate-400">Define la identidad de tu empresa en el ecosistema ARIS.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Razón Social</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="company_name"
                                defaultValue={getSetting('company_name')}
                                placeholder="Ej. Logística Continental"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">RUC / Identificación Fiscal</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="company_ruc"
                                defaultValue={getSetting('company_ruc')}
                                placeholder="Ej. 20123456789"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre del Administrador Maestro</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="admin_name"
                                defaultValue={getSetting('admin_name')}
                                placeholder="Ej. Alex Rivera"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card p-6 border-l-4 border-amber-500 flex gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <ShieldCheck className="text-amber-500" size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Nota Técnica de Sincronización</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Actualmente estás operando en el **Administrador Maestro Local**. Los datos guardados aquí se convertirán en el patrón global para todos los conductores una vez que actives la sincronización con el servidor central de ARIS.
                    </p>
                </div>
            </div>
        </div>
    );
}
