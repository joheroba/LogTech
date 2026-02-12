import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function VoiceButton({ onResult, placeholder = "Dictar contenido..." }) {
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
            setSupported(false);
        }
    }, []);

    const startListening = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new Recognition();

        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Error en reconocimiento de voz:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    if (!supported) return null;

    return (
        <button
            type="button"
            onClick={isListening ? null : startListening}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${isListening
                    ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50'
                }`}
            title={isListening ? "Escuchando..." : "Dictar con voz"}
        >
            {isListening ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
            {isListening && <span className="text-[10px] font-bold uppercase">Escuchando...</span>}
        </button>
    );
}
