import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    BrainCircuit,
    Mic,
    MicOff,
    MessageSquare,
    ArrowLeft,
    Sparkles,
    Activity,
    LayoutDashboard,
    Wallet,
    ShieldAlert,
    Info,
    TrendingUp,
    Navigation,
    Presentation
} from 'lucide-react';
import useArisVoice from '../hooks/useArisVoice';
import { db } from '../db';

export default function AIAssistantModule({ onExit, onNavigate }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [assistantResponse, setAssistantResponse] = useState("Hola, soy Aris. ¿En qué puedo ayudarte hoy?");
    const [isProcessing, setIsProcessing] = useState(false);
    const [visualState, setVisualState] = useState('idle'); // idle, listening, processing, speaking

    const { speak, stop, isReady } = useArisVoice();
    const recognitionRef = useRef(null);

    // Comandos y Lógica de PNL básica
    const processCommand = useCallback(async (text) => {
        const cmd = text.toLowerCase();
        setIsProcessing(true);
        setVisualState('processing');

        let response = "No estoy segura de cómo ayudarte con eso todavía, pero estoy aprendiendo.";

        // 1. Navegación
        if (cmd.includes("dashboard") || cmd.includes("inicio") || cmd.includes("panel")) {
            response = "Entendido, abriendo el panel principal.";
            setTimeout(() => onNavigate('dashboard'), 1500);
        }
        else if (cmd.includes("liquidación") || cmd.includes("gastos") || cmd.includes("dinero")) {
            response = "Claro, vamos al módulo de liquidaciones.";
            setTimeout(() => onNavigate('finance'), 1500);
        }
        else if (cmd.includes("seguridad") || cmd.includes("riesgo") || cmd.includes("sst")) {
            response = "Abriendo el módulo de seguridad y SST.";
            setTimeout(() => onNavigate('safety'), 1500);
        }
        // Elevator Pitch
        else if (cmd.includes('preséntate')) {
            let pitch = "Hola, soy Aris de LogTech. Estoy lista para mostrarte mi valor.";
            if (cmd.includes('rímac')) {
                pitch = "Hola, soy Aris de LogTech. Mi misión es transformar el riesgo en datos accionables. Mediante el análisis acústico y de telemetría en tiempo real, reduzco la siniestralidad de las flotas en un 25 por ciento. Al certificar el buen desempeño y la capacitación de los conductores, permito que empresas como Rímac ajusten primas con precisión quirúrgica, creando un ecosistema de seguridad donde todos ganan.";
            } else if (cmd.includes('minero')) {
                pitch = "Mucho gusto, soy Aris. Opero al cien por ciento sin conexión para proteger la vida en las rutas mineras más exigentes. Mi núcleo en Rust detecta fatiga y distracciones proactivamente. Además, cada segundo de mi telemetría está firmado digitalmente con SHA-256, garantizando evidencias inalterables para sus auditorías de seguridad y cumplimiento. Soy el estándar de transparencia que su operación crítica merece.";
            } else if (cmd.includes('logístico')) {
                pitch = "Soy Aris, su copiloto inteligente. Maximizo la rentabilidad de su flota reduciendo el consumo de combustible en un 8 por ciento y automatizando la liquidación de gastos por voz. Acompaño al conductor en cada kilómetro, educándolo y premiando su prevención mediante tokens canjeables. Conmigo, la logística no solo es más rápida, es financieramente más inteligente.";
            } else if (cmd.includes('academia') || cmd.includes('institución') || cmd.includes('educativo')) {
                pitch = "Es un honor presentarme. Soy Aris, el ecosistema de inteligencia de LogTech. Mi propósito es cerrar la brecha entre la formación académica y la realidad en ruta. Ofrezco a instituciones como la suya un laboratorio de datos en tiempo real, permitiendo certificar a los conductores basándose en su desempeño técnico y ético diario. Con mi sistema de Certificación Dual, no solo formamos conductores, sino especialistas avalados por el prestigio de su academia y la precisión de mi tecnología. Juntos, elevamos el estándar educacional del transporte en el Perú.";
            }
            response = pitch; // Set the pitch as the assistant's response
        }
        // 1.1 Repreguntas de Pitch / FAQ Corporativo
        else if (cmd.includes("internet") || cmd.includes("conexión") || cmd.includes("offline")) {
            response = "Excelente pregunta. Mi núcleo de inteligencia está escrito en Rust y compilado a WebAssembly. Esto me permite procesar telemetría, audio y visión facial directamente en el dispositivo del conductor, sin enviar datos a la nube. Funcionamos perfectamente en socavones mineros o rutas interprovinciales sin señal celular.";
        }
        else if (cmd.includes("privacidad") || cmd.includes("datos") || cmd.includes("seguro")) {
            response = "La privacidad es nuestra prioridad técnica. Cada paquete de evidencia está firmado digitalmente con un Hash SHA-256 inalterable. Los datos solo se comparten con la empresa o la aseguradora bajo protocolos de Aris Ethics, garantizando que el conductor no sea penalizado injustamente y que la información sea verídica.";
        }
        else if (cmd.includes("roi") || cmd.includes("cuánto ahorro") || cmd.includes("rentabilidad")) {
            response = "El retorno de inversión es directo. Reducimos la siniestralidad en un 25% y el consumo de combustible en un 8%. Para una flota de 100 vehículos, esto representa un ahorro proyectado de más de 200,000 dólares anuales. Mi sistema no es un gasto, es una inversión que se paga sola.";
        }
        else if (cmd.includes("tokens") || cmd.includes("canje") || cmd.includes("premios")) {
            response = "Los tokens son la recompensa por el buen manejo y la capacitación. Los conductores pueden canjearlos en nuestro Marketplace por beneficios reales como bonos de conectividad, kits ergonómicos o descuentos en revisiones técnicas, lo que eleva la moral y la retención del talento.";
        }
        else if (cmd.includes("error") || cmd.includes("falsa alarma") || cmd.includes("apelar")) {
            response = "Entiendo la preocupación. Si el sistema detecta un evento, el conductor puede grabar su descargo de inmediato. Nuestra IA de Auditoría analiza el audio y el contexto para descartar falsos positivos, y el Delegado de la empresa tiene la última palabra basándose en evidencias inalterables.";
        }
        else if (cmd.includes("validan") || cmd.includes("estándar") || cmd.includes("pedagógico")) {
            response = "Trabajamos bajo la supervisión de la academia para asegurar que cada lección y trivia cumpla con el estándar pedagógico institucional. No solo enseñamos, certificamos bajo su aval.";
        }
        else if (cmd.includes("qué datos") || cmd.includes("analítica") || cmd.includes("brecha")) {
            response = "La academia recibe analíticas agregadas sobre brechas de conocimiento, permitiéndoles identificar exactamente qué temas necesitan refuerzo en la flota y crear programas presenciales altamente efectivos basados en evidencia real.";
        }
        else if (cmd.includes("metodología") || cmd.includes("enseñanza") || cmd.includes("pedagogía")) {
            response = "Nuestra metodología se basa en el micro-learning adaptativo y la andragogía. Entregamos cápsulas de conocimiento justo en el momento de necesidad, reforzando conceptos mediante trivias dinámicas que aseguran una retención del 80% superior a los métodos tradicionales.";
        }
        else if (cmd.includes("carga cognitiva") || cmd.includes("atención") || cmd.includes("distraer")) {
            response = "La seguridad es lo primero. He diseñado mis lecciones para que duren menos de tres minutos, minimizando la carga cognitiva. El aprendizaje ocurre en momentos de baja exigencia operativa y siempre bajo control de voz, garantizando que el conductor nunca pierda la atención en la ruta.";
        }
        else if (cmd.includes("validez") || cmd.includes("evaluación") || cmd.includes("examen")) {
            response = "La validez de nuestras evaluaciones está garantizada por un banco de preguntas aleatorio y dinámico, supervisado por expertos. No solo medimos memoria, sino la aplicación práctica de protocolos de seguridad en situaciones simuladas por voz.";
        }
        // 2. Consultas de Datos (Dummies por ahora, conectables a db.js)
        else if (cmd.includes("score") || cmd.includes("puntaje") || cmd.includes("mi desempeño")) {
            response = "Tu puntaje de seguridad actual es de 85 puntos. Has mejorado un 5% respecto a la semana pasada. ¡Sigue así!";
        }
        else if (cmd.includes("gasolina") || cmd.includes("combustible")) {
            response = "Has registrado 450 soles en combustible esta semana. ¿Deseas ver el detalle?";
        }
        else if (cmd.includes("hola") || cmd.includes("quién eres")) {
            response = "Hola. Soy Aris, tu asistente inteligente de LogTech. Estoy aquí para cuidar tu seguridad y ayudarte con la gestión de tu ruta.";
        }
        else if (cmd.includes("gracias") || cmd.includes("buen trabajo")) {
            response = "De nada. Es un placer ayudarte. ¿Necesitas algo más?";
        }

        setAssistantResponse(response);
        setVisualState('speaking');
        await speak(response);
        setVisualState('idle');
        setIsProcessing(false);
    }, [onNavigate, speak]);

    // Configuración de Reconocimiento de Voz
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;

        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        const recognition = new Recognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false; // Queremos que se detenga al terminar la frase
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setVisualState('listening');
            setTranscript("");
        };

        recognition.onresult = (event) => {
            const current = event.results[event.results.length - 1][0].transcript;
            setTranscript(current);
            if (event.results[event.results.length - 1].isFinal) {
                processCommand(current);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            if (visualState === 'listening') setVisualState('idle');
        };

        recognitionRef.current = recognition;

        // Saludo inicial
        const initialGreet = setTimeout(() => {
            if (isReady) speak(assistantResponse);
        }, 1000);

        return () => {
            clearTimeout(initialGreet);
            stop();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [isReady, assistantResponse, speak, stop, processCommand, visualState]); // Added dependencies

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            stop(); // Detener cualquier habla antes de escuchar
            recognitionRef.current?.start();
        }
    };

    const handleCommand = useCallback((commandText) => {
        stop(); // Stop current speech if any
        setTranscript(commandText); // Optionally show the command in transcript
        processCommand(commandText);
    }, [processCommand, stop]);

    return (
        <div className="flex flex-col gap-8 h-full animate-fade-in relative max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onExit}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    <Sparkles size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Aris Intelligence</span>
                </div>
            </div>

            {/* AI Core Visualization */}
            <div className="flex-1 flex flex-col items-center justify-center gap-12 py-10">
                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => handleCommand('Aris, preséntate a Rímac')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-full text-[10px] font-bold border border-red-500/20 hover:bg-red-600/30 transition-all uppercase tracking-wider"
                    >
                        <Presentation size={12} /> Pitch Rímac
                    </button>
                    <button
                        onClick={() => handleCommand('Aris, preséntate al Director Minero')}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-400 rounded-full text-[10px] font-bold border border-amber-500/20 hover:bg-amber-600/30 transition-all uppercase tracking-wider"
                    >
                        <Presentation size={12} /> Pitch Minero
                    </button>
                    <button
                        onClick={() => handleCommand('Aris, preséntate al Gerente Logístico')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20 hover:bg-blue-600/30 transition-all uppercase tracking-wider"
                    >
                        <Presentation size={12} /> Pitch Logística
                    </button>
                    <button
                        onClick={() => handleCommand('Aris, preséntate al Director Académico')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20 hover:bg-emerald-600/30 transition-all uppercase tracking-wider"
                    >
                        <Presentation size={12} /> Pitch Academia
                    </button>
                </div>
                <div className="relative">
                    {/* Animated Rings */}
                    <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${visualState === 'listening' ? 'bg-red-500/30 scale-150 animate-pulse' :
                        visualState === 'speaking' ? 'bg-indigo-500/30 scale-125 animate-bounce-subtle' :
                            visualState === 'processing' ? 'bg-cyan-500/30 scale-110 animate-spin-slow' :
                                'bg-indigo-500/10 scale-100'
                        }`}></div>

                    {/* Brain Icon */}
                    <div className={`relative w-40 h-40 rounded-full glass border-2 flex items-center justify-center transition-all duration-500 ${visualState === 'listening' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' :
                        visualState === 'speaking' ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]' :
                            'border-slate-800'
                        }`}>
                        {visualState === 'listening' ? (
                            <Activity className="text-red-500 animate-pulse" size={64} />
                        ) : visualState === 'processing' ? (
                            <BrainCircuit className="text-cyan-400 animate-spin-slow" size={64} />
                        ) : (
                            <BrainCircuit className="text-indigo-400" size={64} />
                        )}
                    </div>
                </div>

                {/* Subtitles / Text Display */}
                <div className="text-center flex flex-col gap-4 max-w-lg">
                    <h3 className={`text-xl font-bold transition-all duration-300 ${isProcessing ? 'text-cyan-400' : 'text-white'}`}>
                        {visualState === 'listening' ? "Escuchando..." :
                            visualState === 'processing' ? "Procesando..." :
                                visualState === 'speaking' ? "Aris Responde" : "Hola, soy Aris"}
                    </h3>
                    <p className="text-slate-400 min-h-[3rem] line-clamp-2 leading-relaxed italic">
                        {isListening ? (transcript || "Dime algo...") : assistantResponse}
                    </p>
                </div>

                {/* Main Mic Button */}
                <button
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isListening ? 'bg-red-600 scale-110 animate-pulse' : 'bg-indigo-600 hover:scale-105 active:scale-95'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isListening ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
                </button>
            </div>

            {/* Suggested Commands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                <CommandChip icon={<LayoutDashboard size={16} />} text='Aris, abre el dashboard' onClick={() => processCommand("Aris, abre el dashboard")} />
                <CommandChip icon={<Activity size={16} />} text='¿Cuál es mi puntaje de hoy?' onClick={() => processCommand("¿Cuál es mi puntaje de hoy?")} />
            </div>

            {/* Offline Status Footer */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest pb-4">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span>Motor Neural Offline</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Voz de Patricia Activa</span>
                </div>
            </div>
        </div>
    );
}

function CommandChip({ icon, text, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 rounded-2xl text-left transition-all hover:border-indigo-500/30 group"
        >
            <div className="p-2 bg-slate-800 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-400 rounded-lg text-slate-500">
                {icon}
            </div>
            <span className="text-sm font-medium text-slate-300">{text}</span>
        </button>
    );
}
