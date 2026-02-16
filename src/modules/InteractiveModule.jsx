import React, { useState, useEffect } from 'react';
import { db } from '../db';
import {
    Gamepad2,
    Mic,
    Trophy,
    MessageSquare,
    Play,
    Square,
    CheckCircle2,
    BrainCircuit,
    Star,
    Truck,
    Bike,
    User,
    Info
} from 'lucide-react';

export default function InteractiveModule() {
    const [activeMode, setActiveMode] = useState('trivia');
    const [isOnboarding, setIsOnboarding] = useState(true);
    const [userProfile, setUserProfile] = useState({ role: '', vehicle: '' });
    const [isRecording, setIsRecording] = useState(false);
    const [score, setScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isWaitingForNext, setIsWaitingForNext] = useState(false);
    const [arisActive, setArisActive] = useState(false);

    // TTS: Aris Habla
    const speak = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'es-ES';
        msg.rate = 0.9; // Un poco más lento para claridad
        window.speechSynthesis.speak(msg);
    };

    // Trivias segmentadas
    const triviaData = {
        onboarding: [
            {
                q: "Bienvenido a Aris. Para empezar, ¿cuál es tu rol principal?",
                options: ["Administrador", "Chofer / Operador", "Auditor"],
                type: 'role',
                tip: "Aris dice: Configurando tu perfil según tus responsabilidades."
            },
            {
                q: "Practiquemos la voz. Di: 'Aris, Uno' para elegir la motocicleta.",
                options: ["Camión", "Furgoneta", "Motocicleta", "Automóvil"],
                type: 'vehicle',
                tip: "Aris dice: ¡Excelente! Me has activado correctamente. Ahora responder por voz es seguro."
            }
        ],
        truck: [
            { q: "¿Qué distancia mínima debes mantener en carretera mojada con un furgón cargado?", options: ["20 metros", "50 metros", "El doble de lo normal"], correct: 2, tip: "Aris dice: El peso aumenta la inercia, frena con anticipación." },
            { q: "¿Cada cuánto recomienda Aris una pausa activa en ruta larga?", options: ["Cada 2 horas", "Cada 5 horas", "Solo al llegar"], correct: 0, tip: "Aris dice: La fatiga es el mayor riesgo, ¡haz una pausa!" }
        ],
        bike: [
            { q: "¿En qué ángulo de inclinación activa Aris la alerta de caída?", options: ["30 grados", "45 grados", "60 grados"], correct: 1, tip: "Aris dice: Detecto inclinaciones bruscas para enviar ayuda inmediata." },
            { q: "¿Qué sensor es vital para tu Safety Score en moto?", options: ["G-Shock (Frenado)", "Radio", "Espejo"], correct: 0, tip: "Aris dice: Los frenazos bruscos impactan tu score de seguridad." }
        ],
        general: [
            { q: "¿Cuál es el objetivo principal de Aris?", options: ["Solo GPS", "Tu seguridad y eficiencia", "Controlar la música"], correct: 1, tip: "Aris dice: Estoy aquí para cuidarte en cada kilómetro." }
        ]
    };

    const currentQuestions = isOnboarding
        ? triviaData.onboarding
        : (triviaData[userProfile.vehicle.toLowerCase()] || triviaData.general);

    const handleAnswer = (index) => {
        if (isOnboarding) {
            const step = triviaData.onboarding[triviaStep];
            if (step.type === 'role') setUserProfile(prev => ({ ...prev, role: step.options[index] }));
            if (step.type === 'vehicle') {
                const vMapping = { 0: 'truck', 1: 'van', 2: 'bike', 3: 'car' };
                setUserProfile(prev => ({ ...prev, vehicle: vMapping[index] }));
            }

            setShowFeedback(true);
            setIsWaitingForNext(true); // Esperar confirmación de voz o clic
            speak(step.tip + ". Di 'Aris, listo' para continuar.");
        } else {
            const isCorrect = index === currentQuestions[triviaStep].correct;
            if (isCorrect) setScore(score + 10);
            setShowFeedback(true);
            setIsWaitingForNext(true);
            speak(currentQuestions[triviaStep].tip + ". Di 'Aris, continuar' para el siguiente reto.");
        }
    };

    const nextStep = () => {
        setShowFeedback(false);
        setIsWaitingForNext(false);
        if (isOnboarding) {
            if (triviaStep + 1 < triviaData.onboarding.length) {
                setTriviaStep(triviaStep + 1);
            } else {
                setIsOnboarding(false);
                setTriviaStep(0);
            }
        } else {
            setTriviaStep((prev) => (prev + 1) % currentQuestions.length);
        }
    };

    // STT: Aris Escucha
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;
        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new Recognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1][0].transcript.toLowerCase();
            console.log("Aris escuchó:", result);

            if (result.includes("aris")) {
                setArisActive(true);
                setTimeout(() => setArisActive(false), 3000);

                if (isWaitingForNext) {
                    if (result.includes("listo") || result.includes("continuar") || result.includes("oído")) {
                        nextStep();
                    }
                } else if (activeMode === 'trivia' || isOnboarding) {
                    if (result.includes("repite") || result.includes("otra vez")) {
                        const q = currentQuestions[triviaStep];
                        const optionsText = q.options.map((opt, i) => `Opción ${i + 1}: ${opt}`).join(". ");
                        speak(`Claro. Repito: ${q.q}. Las opciones son: ${optionsText}`);
                    }
                    if (result.includes("opción uno") || result.includes("uno")) handleAnswer(0);
                    if (result.includes("opción dos") || result.includes("dos")) handleAnswer(1);
                    if (result.includes("opción tres") || result.includes("tres")) handleAnswer(2);
                    if (result.includes("opción cuatro") || result.includes("cuatro")) handleAnswer(3);
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
    }, [isWaitingForNext, triviaStep, activeMode, isOnboarding]);

    // Leer pregunta al cambiar
    useEffect(() => {
        if ((activeMode === 'trivia' || isOnboarding) && !showFeedback) {
            const q = currentQuestions[triviaStep];
            const optionsText = q.options.map((opt, i) => `Opción ${i + 1}: ${opt}`).join(". ");
            speak(`${q.q}. Las opciones son: ${optionsText}`);
        }
    }, [triviaStep, isOnboarding, activeMode, showFeedback]);

    const startRecording = () => {
        setIsRecording(true);
        if (window.speechSynthesis) {
            const msg = new SpeechSynthesisUtterance("Te escucho. Cuéntame tu anécdota.");
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        await db.contributions.add({
            driver_dni: '12345678',
            type: 'Anecdota',
            status: 'Pendiente',
            timestamp: new Date()
        });
        if (window.speechSynthesis) {
            const msg = new SpeechSynthesisUtterance("Gracias. Enviaré tu anécdota al administrador.");
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Aris Interactiva</h2>
                    <p className="text-slate-500 text-xs italic">Manos Libres: Di "Aris" seguido de "Uno", "Listo" o "Repite"</p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
                    <Gamepad2 size={24} />
                </div>
            </div>

            {!isOnboarding && (
                <div className="flex gap-4 p-1 bg-slate-900/50 rounded-2xl w-fit">
                    <button onClick={() => setActiveMode('trivia')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'trivia' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Trivias</button>
                    <button onClick={() => setActiveMode('stories')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'stories' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Mi Voz</button>
                </div>
            )}

            {activeMode === 'trivia' || isOnboarding ? (
                <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden">
                    {!isOnboarding && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                            <Trophy size={16} className="text-amber-400" />
                            <span className="text-xs font-bold text-indigo-300">{score} pts</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                            {userProfile.vehicle === 'bike' ? <Bike size={24} /> : <Truck size={24} />}
                        </div>
                        <h3 className="font-bold text-lg">{isOnboarding ? "Aprendizaje del Sistema" : `Reto ${userProfile.vehicle}`}</h3>
                    </div>

                    {!showFeedback ? (
                        <>
                            <p className="text-slate-200 text-lg leading-snug">{currentQuestions[triviaStep].q}</p>
                            <div className="grid grid-cols-1 gap-3">
                                {currentQuestions[triviaStep].options.map((opt, i) => (
                                    <button key={i} onClick={() => handleAnswer(i)} className="p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-left text-sm transition-all hover:translate-x-1 relative overflow-hidden group">
                                        <div className="flex items-center justify-between">
                                            <span>{opt}</span>
                                            <span className="text-[10px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">DI: "ARIS, {i + 1}"</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 animate-bounce-subtle">
                            {isOnboarding ? <User size={48} className="text-indigo-400 mb-4" /> : <CheckCircle2 size={48} className="text-emerald-500 mb-4" />}
                            <p className="text-slate-300 italic text-center max-w-xs uppercase font-bold tracking-tighter mb-6">
                                {currentQuestions[triviaStep].tip}
                            </p>
                            <button onClick={nextStep} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg animate-pulse">
                                {isListening ? 'ESCUCHANDO: "ARIS, CONTINUAR"' : 'CONTINUAR'}
                            </button>
                        </div>
                    )}

                    {arisActive && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 animate-pulse">
                            <BrainCircuit size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Aris te escucha...</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-8 flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400">
                        <Mic size={40} className={isRecording ? 'animate-pulse text-red-500' : ''} />
                    </div>
                    <h3 className="text-xl font-bold">Cuéntale a Aris</h3>
                    <p className="text-slate-400 text-sm max-w-xs">{isRecording ? "Grabando..." : "Graba un tip o anécdota sobre tu ruta hoy."}</p>
                    <button onClick={isRecording ? stopRecording : startRecording} className={`px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${isRecording ? 'bg-red-600' : 'bg-indigo-600'}`}>
                        {isRecording ? "Detener" : "Grabar"}
                    </button>
                </div>
            )}

            <div className="glass-card p-6 border-l-4 border-indigo-500 flex gap-4">
                <Info className="text-indigo-400 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                    Aris está aprendiendo de ti. Completar el onboarding inicial desbloquea funciones de seguridad avanzadas específicas para **{userProfile.vehicle || 'tu vehículo'}**.
                </p>
            </div>
        </div>
    );
}
