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
    BrainCircuit,
    Search,
    Filter,
    CheckCircle2,
    X
} from 'lucide-react';
import useArisVoice from '../hooks/useArisVoice';

// Preguntas de verificación (Demo)
const PODCAST_QUIZZES = {
    'Conducción en Lluvia': {
        q: "¿Cuánto debe aumentar la distancia de frenado en lluvia?",
        options: ["Se mantiene igual", "Se reduce a la mitad", "Aumenta al doble"],
        correct: 2,
        tip: "Aris dice: Correcto. El asfalto mojado reduce drásticamente el agarre."
    },
    'Optimización de Combustible': {
        q: "¿Qué porcentaje de combustible se puede ahorrar con velocidad constante?",
        options: ["Hasta un 5%", "Hasta un 15%", "No hay ahorro real"],
        correct: 1,
        tip: "Aris dice: ¡Bien hecho! La inercia es tu mejor aliada para la eficiencia."
    },
    'Tutorial: Comandos de Voz Aris': {
        q: "¿Qué palabra debes decir antes de cualquier comando para que Aris te escuche?",
        options: ["Hola", "Aris", "Escuchar"],
        correct: 1,
        tip: "Aris dice: Exacto. Soy Aris, y siempre estoy atenta a tu voz."
    },
    'Tutorial: Liquidación de Gastos': {
        q: "¿Qué acción es necesaria para que el administrador valide un gasto?",
        options: ["Solo escribirlo", "Llamar por teléfono", "Capturar la foto del recibo"],
        correct: 2,
        tip: "Aris dice: ¡Correcto! La evidencia visual es clave para una liquidación rápida."
    },
    'Normativa MTC: Jornada de Manejo': {
        q: "¿Cuál es el tiempo máximo de conducción continua permitida de noche?",
        options: ["3 horas", "4 horas", "5 horas"],
        correct: 1,
        tip: "Aris dice: Correcto. De noche la fatiga aumenta, el límite es de 4 horas."
    },
    'RNT: Carriles de Circulación': {
        q: "¿Por qué carril deben circular preferentemente los camiones según el RNT?",
        options: ["Carril Izquierdo", "Carril Central", "Carril Derecho"],
        correct: 2,
        tip: "Aris dice: ¡Bien! Mantener el carril derecho facilita la fluidez del tránsito."
    }
};

export default function PodcastModule({ onExit }) {
    const podcasts = useLiveQuery(() => db.podcasts.toArray()) || [];
    const [currentPodcastIndex, setCurrentPodcastIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [arisActive, setArisActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState(null); // 'correct' | 'wrong'

    // Motor de Voz Neural Offline (Aris Voice)
    const { speak: arisSpeak, stop: arisStop, isReady } = useArisVoice();

    // Filtrado de Podcasts
    const filteredPodcasts = podcasts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const currentPodcast = filteredPodcasts[currentPodcastIndex];
    const categories = ['Todos', ...new Set(podcasts.map(p => p.category))];

    // Tracking de Progreso
    const markAsLearned = async (podcastId) => {
        const assignment = await db.assignments.orderBy('id').last();
        if (assignment && podcastId) {
            await db.podcasts_progress.add({
                podcast_id: podcastId,
                person_dni: assignment.driver_dni,
                status: 'completado',
                completed_at: Date.now()
            });

            arisSpeak("Excelente. Para certificar esta cápsula, respóndeme una breve trivia. Di 'Aris' y la opción correcta.");

            // Activar modo Quiz tras un breve retraso
            setTimeout(() => {
                setShowQuiz(true);
                setQuizResult(null);
                const quiz = PODCAST_QUIZZES[podcasts.find(p => p.id === podcastId)?.title];
                if (quiz) {
                    const optionsText = quiz.options.map((opt, i) => `Opción ${i + 1}: ${opt}`).join(". ");
                    speak(`Pregunta: ${quiz.q}. Las opciones son: ${optionsText}`);
                }
            }, 3500);
        }
    };

    const handleQuizAnswer = (index) => {
        const quiz = PODCAST_QUIZZES[currentPodcast?.title];
        if (!quiz) return;

        if (index === quiz.correct) {
            setQuizResult('correct');
            speak(quiz.tip + " ¡Lección certificada!");
            setTimeout(() => setShowQuiz(false), 5000);
        } else {
            setQuizResult('wrong');
            speak("Aris dice: Esa no es la respuesta correcta. Escucha la cápsula nuevamente para mejorar tu score.");
            setTimeout(() => setShowQuiz(false), 5000);
        }
    };

    // TTS: Aris Habla (Wrapper con fallback)
    const speak = (text, onEnd) => {
        if (isReady) {
            arisSpeak(text).then(onEnd);
        } else {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.onend = onEnd;
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        return () => {
            arisStop();
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            arisStop();
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            if (currentPodcast) {
                speak(currentPodcast.content, () => setIsPlaying(false));
                setIsPlaying(true);
            }
        }
    };

    const nextPodcast = () => {
        arisStop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentPodcastIndex((prev) => (prev + 1) % Math.max(1, filteredPodcasts.length));
    };

    const prevPodcast = () => {
        arisStop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentPodcastIndex((prev) => (prev - 1 + filteredPodcasts.length) % Math.max(1, filteredPodcasts.length));
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
                    arisStop();
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
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

                if (showQuiz) {
                    if (result.includes("opción uno") || result.includes("uno")) handleQuizAnswer(0);
                    if (result.includes("opción dos") || result.includes("dos")) handleQuizAnswer(1);
                    if (result.includes("opción tres") || result.includes("tres")) handleQuizAnswer(2);
                    return;
                }

                if (result.includes("aprendí") || result.includes("lección aprendida") || result.includes("completado")) {
                    if (currentPodcast) {
                        markAsLearned(currentPodcast.id);
                    }
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
    }, [isPlaying, currentPodcastIndex, filteredPodcasts, showQuiz, currentPodcast]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Aris Audio: Micro-Podcast</h2>
                    <p className="text-slate-500 text-xs italic">Manos Libres: Di "Aris" seguido de "Pausa", "Siguiente" o "Aprendí esto"</p>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full">
                    <Headphones size={24} />
                </div>
            </div>

            {/* Buscador y Filtros */}
            {!showQuiz && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar capacitación..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 pl-10 text-sm"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPodcastIndex(0);
                            }}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setCurrentPodcastIndex(0);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-cyan-500 text-slate-900'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showQuiz ? (
                <div className="glass-card p-10 flex flex-col items-center text-center gap-6 border-2 border-cyan-500/50 bg-cyan-950/20 animate-in zoom-in duration-300">
                    <BrainCircuit size={48} className="text-cyan-400 animate-pulse" />
                    <h3 className="text-xl font-bold uppercase tracking-widest text-cyan-300">Trivia de Verificación</h3>

                    {quizResult === null ? (
                        <>
                            <p className="text-lg font-medium text-white">{PODCAST_QUIZZES[currentPodcast?.title]?.q}</p>
                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                {PODCAST_QUIZZES[currentPodcast?.title]?.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuizAnswer(i)}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-sm transition-all"
                                    >
                                        <span className="text-cyan-400 font-bold mr-2">{i + 1}.</span> {opt}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500">DI: "ARIS, OPCIÓN [NÚMERO]"</p>
                        </>
                    ) : (
                        <div className={`flex flex-col items-center gap-4 ${quizResult === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {quizResult === 'correct' ? <CheckCircle2 size={64} /> : <X size={64} />}
                            <p className="text-2xl font-black uppercase tracking-tighter">{quizResult === 'correct' ? '¡CORRECTO!' : 'VUELVE A INTENTAR'}</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{PODCAST_QUIZZES[currentPodcast?.title]?.tip}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
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
                            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mb-6">
                                {currentPodcast.content.substring(0, 100)}...
                            </p>
                            <button
                                onClick={() => markAsLearned(currentPodcast.id)}
                                className="btn-secondary text-[10px] py-1 border-cyan-500/30 text-cyan-400"
                            >
                                <CheckCircle2 size={12} /> Marcar como aprendido
                            </button>
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                    <div className="flex gap-4">
                        <Info className="text-amber-500 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">¿Por qué escuchar esto?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Completar estas cápsulas y trivias mejora tu **Safety Score** y reduce tu tasa de incidentes en un 15%.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                    <div className="flex gap-4">
                        <Award className="text-emerald-500 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">Certificación Aris</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Cada trivia correcta te otorga insignias de **Experto en Ruta** que benefician tu perfil profesional.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
