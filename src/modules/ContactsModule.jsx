import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Phone,
    UserPlus,
    Search,
    Shield,
    Trash2,
    MessageCircle,
    PhoneCall
} from 'lucide-react';

export default function ContactsModule() {
    const contacts = useLiveQuery(() => db.contacts.toArray()) || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', phone: '', type: 'Emergencia' });

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddContact = async (e) => {
        e.preventDefault();
        await db.contacts.add({ ...newContact, is_synced: 0 });
        setNewContact({ name: '', phone: '', type: 'Emergencia' });
        setShowAddForm(false);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este contacto?')) {
            await db.contacts.delete(id);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Directorio de Emergencia</h2>
                    <p className="text-slate-500 text-sm">Gestiona contactos para llamadas por voz rápidas.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary"
                >
                    <UserPlus size={18} />
                    {showAddForm ? 'Cerrar' : 'Añadir Contacto'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Lista de Contactos */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="glass-card p-4 flex items-center gap-3">
                        <Search size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar contacto..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredContacts.map(contact => (
                            <div key={contact.id} className="glass-card p-5 group hover:border-blue-500/50 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${contact.type === 'Emergencia' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {contact.type === 'Emergencia' ? <Shield size={18} /> : <PhoneCall size={18} />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(contact.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg">{contact.name}</h4>
                                <p className="text-slate-500 text-sm mb-4 font-medium">{contact.phone}</p>
                                <div className="flex gap-2">
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-2 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                                    >
                                        <Phone size={14} /> Llamar
                                    </a>
                                    <a
                                        href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Añadir / Ayuda */}
                <div className="flex flex-col gap-6">
                    {showAddForm && (
                        <div className="glass-card p-6 animate-slide-up">
                            <h3 className="font-bold mb-4">Nuevo Contacto</h3>
                            <form onSubmit={handleAddContact} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nombre</label>
                                    <input
                                        type="text" required
                                        className="input-field"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Teléfono</label>
                                    <input
                                        type="tel" required
                                        className="input-field"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                                    <select
                                        className="input-field bg-slate-900"
                                        value={newContact.type}
                                        onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                                    >
                                        <option value="Emergencia">Emergencia</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Personal">Personal</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary w-full justify-center">
                                    Guardar Contacto
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="glass-card p-6 bg-blue-600/5">
                        <h3 className="font-bold flex items-center gap-2 mb-3">
                            <PhoneCall size={18} className="text-blue-400" />
                            Comandos de Voz
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            En el módulo de **Seguridad**, activa el reconocimiento de voz para realizar llamadas manos libres.
                        </p>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <p className="text-[10px] font-bold text-blue-400 mb-1 italic">Estructura del comando:</p>
                            <p className="text-xs font-medium">"Llamar a [Nombre del contacto]"</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
