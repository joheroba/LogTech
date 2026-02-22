import React, { useState } from 'react';
import {
    Shield,
    Key,
    ChevronRight,
    Sparkles,
    UserCircle,
    Truck,
    Cpu
} from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginModule({ onLogin }) {
    const [loading, setLoading] = useState(false);

    const handleDemoLogin = () => {
        setLoading(true);
        // Simular latencia de verificación Aris Ethics
        setTimeout(() => {
            onLogin({
                name: 'Driver Demo Aris',
                role: 'conductor',
                company: 'LogTech Field Test Unit',
                isDemo: true
            });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex items-center justify-center p-6 sm:p-0">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md animate-scale-in">
                <div className="glass-card p-10 flex flex-col items-center gap-8 border-slate-800 shadow-2xl relative overflow-hidden">
                    {/* LogTech Identity */}
                    <div className="flex flex-col items-center gap-2">
                        <Logo size={64} />
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mt-4">Aris Intelligence</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">LogTech Ecosystem</p>
                    </div>

                    {/* Login Options */}
                    <div className="w-full flex flex-col gap-4">
                        <div className="relative group">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="DNI o Usuario"
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                                disabled
                                title="Deshabilitado en modo prueba rápida"
                            />
                        </div>

                        <button
                            disabled={loading}
                            onClick={handleDemoLogin}
                            className="group relative w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] active:scale-[0.98] overflow-hidden"
                        >
                            {loading ? (
                                <Cpu className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    <span className="uppercase tracking-widest text-sm">Iniciar Acceso Demo</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}

                            {/* Inner Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>

                        <div className="flex items-center gap-4 my-2">
                            <div className="h-px flex-1 bg-slate-800"></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">O accede con</span>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold">
                                <Key size={14} /> NFC
                            </button>
                            <button className="flex items-center justify-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold">
                                <Shield size={14} /> Biometría
                            </button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-4 flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span>Verificación Ética Activa</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-600 max-w-[240px] italic">
                            Esta sesión será monitoreada por el núcleo Aris para fines de prueba y seguridad vial.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                    <Truck className="text-slate-800" size={24} />
                    <Cpu className="text-slate-800" size={24} />
                    <Shield className="text-slate-800" size={24} />
                </div>
            </div>
        </div>
    );
}
