import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    Headphones,
    Info,
    Award,
    BrainCircuit
} from 'lucide-react';

export default function PodcastModule({ onExit }) {
    const podcasts = useLiveQuery(() => db.podcasts.toArray()) || [];
    const [currentPodcastIndex, setCurrentPodcastIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speechInstance, setSpeechInstance] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [arisActive, setArisActive] = useState(false);

    const currentPodcast = podcasts[currentPodcastIndex];

    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            if (currentPodcast) {
                const utterance = new SpeechSynthesisUtterance(currentPodcast.content);
                utterance.lang = 'es-ES';
                utterance.onend = () => setIsPlaying(false);
                window.speechSynthesis.speak(utterance);
                setSpeechInstance(utterance);
                setIsPlaying(true);
            }
        }
    };

    const nextPodcast = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentPodcastIndex((prev) => (prev + 1) % podcasts.length);
    };

    const prevPodcast = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentPodcastIndex((prev) => (prev - 1 + podcasts.length) % podcasts.length);
    };

    // STT: Aris Escucha (Podcast)
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;
        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new Recognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1][0].transcript.toLowerCase();
            console.log("Aris Audio escuchó:", result);

            if (result.includes("aris")) {
                setArisActive(true);
                setTimeout(() => setArisActive(false), 3000);

                if (result.includes("salir") || result.includes("cerrar") || result.includes("dashboard")) {
                    window.speechSynthesis.cancel();
                    onExit();
                    return;
                }

                if (result.includes("pausa") || result.includes("detener") || result.includes("espera")) {
                    if (isPlaying) togglePlay();
                    return;
                }

                if (result.includes("continúa") || result.includes("sigue") || result.includes("reproduce") || result.includes("play")) {
                    if (!isPlaying) togglePlay();
                    return;
                }

                if (result.includes("siguiente") || result.includes("adelanta")) {
                    nextPodcast();
                    return;
                }

                if (result.includes("anterior") || result.includes("atrás")) {
                    prevPodcast();
                    return;
                }

                if (result.includes("repite") || result.includes("otra vez")) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(currentPodcast.content);
                    utterance.lang = 'es-ES';
                    utterance.onend = () => setIsPlaying(false);
                    window.speechSynthesis.speak(utterance);
                    setIsPlaying(true);
                    return;
                }
            }
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => recognition.start(); // Mantener escucha activa

        recognition.start();
        return () => {
            recognition.onend = null;
            recognition.stop();
        };
    }, [isPlaying, currentPodcastIndex, podcasts]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Aris Audio: Micro-Podcast</h2>
                    <p className="text-slate-500 text-xs italic">Manos Libres: Di "Aris" seguido de "Pausa", "Siguiente" o "Salir"</p>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full">
                    <Headphones size={24} />
                </div>
            </div>

            <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl"></div>

                <div className="w-32 h-32 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-slate-700">
                    <Volume2 size={48} className={isPlaying ? "text-cyan-400 animate-pulse" : "text-slate-500"} />
                </div>

                {currentPodcast ? (
                    <div className="mb-8">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                            Categoría: {currentPodcast.category}
                        </span>
                        <h3 className="text-2xl font-bold mt-4 mb-2">{currentPodcast.title}</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                            {currentPodcast.content.substring(0, 100)}...
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-500 mb-8 italic">Cargando episodios...</p>
                )}

                <div className="flex items-center gap-8">
                    <button onClick={prevPodcast} className="p-3 text-slate-400 hover:text-white transition-colors">
                        <SkipBack size={32} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-cyan-500 text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                    </button>
                    <button onClick={nextPodcast} className="p-3 text-slate-400 hover:text-white transition-colors">
                        <SkipForward size={32} />
                    </button>
                </div>

                {arisActive && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 animate-pulse">
                        <BrainCircuit size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Aris te escucha...</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                    <div className="flex gap-4">
                        <Info className="text-amber-500 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">¿Por qué escuchar esto?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Completar estas cápsulas de audio mejora tu **Safety Score** y reduce tu tasa de incidentes en un 15%.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                    <div className="flex gap-4">
                        <Award className="text-emerald-500 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">Progreso de Certificación</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Llevas 5/12 episodios escuchados esta semana. ¡Sigue así para obtener tu bono de seguridad!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
