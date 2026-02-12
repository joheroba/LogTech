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
    Star
} from 'lucide-react';

export default function InteractiveModule() {
    const [activeMode, setActiveMode] = useState('trivia'); // 'trivia' o 'stories'
    const [isRecording, setIsRecording] = useState(false);
    const [triviaStep, setTriviaStep] = useState(0);
    const [score, setScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);

    const triviaQuestions = [
        {
            q: "¿Cuál es la distancia de seguridad recomendada en carretera mojada?",
            options: ["El doble que en seco", "La misma", "Unos 5 metros"],
            correct: 0,
            tip: "Aris dice: La lluvia duplica la distancia de frenado. ¡Ten cuidado!"
        },
        {
            q: "¿Qué sensor de Aris detecta una caída de moto?",
            options: ["GPS", "G-Shock (Inclinación)", "Voz"],
            correct: 1,
            tip: "Aris dice: Uso el giroscopio para detectar inclinaciones peligrosas."
        }
    ];

    const handleAnswer = (index) => {
        if (index === triviaQuestions[triviaStep].correct) {
            setScore(score + 10);
        }
        setShowFeedback(true);
        setTimeout(() => {
            setShowFeedback(false);
            setTriviaStep((prev) => (prev + 1) % triviaQuestions.length);
        }, 3000);
    };

    const startRecording = () => {
        setIsRecording(true);
        // Simulación de captura de audio (en una APK real usaría MediaRecorder)
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
            const msg = new SpeechSynthesisUtterance("Gracias. Enviaré tu anécdota al administrador para el próximo podcast.");
            msg.lang = 'es-ES';
            window.speechSynthesis.speak(msg);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Aris Interactiva</h2>
                    <p className="text-slate-500 text-sm italic">Entretente y aprende mientras vas en ruta.</p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
                    <Gamepad2 size={24} />
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-4 p-1 bg-slate-900/50 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveMode('trivia')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'trivia' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Aris Trivia
                </button>
                <button
                    onClick={() => setActiveMode('stories')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'stories' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Voz del Conductor
                </button>
            </div>

            {activeMode === 'trivia' ? (
                <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                        <Trophy size={16} className="text-amber-400" />
                        <span className="text-xs font-bold text-indigo-300">{score} pts</span>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                            <BrainCircuit size={24} />
                        </div>
                        <h3 className="font-bold text-lg">Reto de Seguridad</h3>
                    </div>

                    {!showFeedback ? (
                        <>
                            <p className="text-slate-200 text-lg leading-snug">
                                {triviaQuestions[triviaStep].q}
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {triviaQuestions[triviaStep].options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        className="p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-left text-sm transition-all hover:translate-x-1"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 animate-bounce-subtle">
                            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                            <p className="text-slate-300 italic text-center max-w-xs uppercase font-bold tracking-tighter">
                                {triviaQuestions[triviaStep].tip}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-8 flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 mb-2">
                        <Mic size={40} className={isRecording ? 'animate-pulse text-red-500' : ''} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-2">Comparte tu Experiencia</h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            Graba una anécdota, un tip de ruta o un saludo. ¡Aris lo procesará para el próximo podcast comunitario!
                        </p>
                    </div>

                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/40 active:scale-95"
                        >
                            <Play size={20} fill="currentColor" />
                            Empezar a Grabar
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/40 animate-pulse"
                        >
                            <Square size={20} fill="currentColor" />
                            Detener y Enviar
                        </button>
                    )}

                    {isRecording && (
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-1.5 h-8 bg-indigo-500 rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sidebar de Rewards */}
            <div className="glass-card p-6 bg-gradient-to-r from-indigo-900/20 to-transparent border-l-4 border-indigo-500">
                <div className="flex items-center gap-4">
                    <Star className="text-amber-400 fill-amber-400" size={24} />
                    <div>
                        <h4 className="font-bold text-sm">Tu Impacto</h4>
                        <p className="text-xs text-slate-400">
                            Has aportado 3 anécdotas aprobadas. ¡Estás en el Top 5 de la semana!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
