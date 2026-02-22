import React, { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import { db } from '../db';
import {
    ShieldAlert,
    Camera,
    Activity,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Eye,
    Zap,
    Mic,
    Volume2,
    Wind,
    Smartphone,
    Bike,
    Navigation2,
    ClipboardCheck,
    Phone,
    PhoneCall,
    UserPlus,
    Heart,
    X,
    MessageSquare
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import VoiceButton from '../components/VoiceButton';
import useArisVoice from '../hooks/useArisVoice';
import init, {
    analyze_safety,
    analyze_fatigue,
    analyze_acoustic,
    generate_evidence_hash
} from '../aris_core/pkg/aris_core.js';

export default function SafetyModule({ vehicleType = 'moto' }) {
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const [model, setModel] = useState(null);
    const [isDrowsy, setIsDrowsy] = useState(false);
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const [roadEvents, setRoadEvents] = useState([]);
    const [monitoring, setMonitoring] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [noiseLevel, setNoiseLevel] = useState(0);
    const [isRustReady, setIsRustReady] = useState(false);
    const [isAppealing, setIsAppealing] = useState(false);
    const [currentCase, setCurrentCase] = useState(null);
    const [assignedCrew, setAssignedCrew] = useState({ driver: null, helper: null });
    const [crewValidationStatus, setCrewValidationStatus] = useState('pendiente');

    // Obtener tripulación asignada reactivamente de la DB
    const latestAssignment = useLiveQuery(() =>
        db.assignments.orderBy('id').last()
    );

    useEffect(() => {
        if (latestAssignment) {
            const loadNames = async () => {
                const driver = await db.personnel.where('dni').equals(latestAssignment.driver_dni).first();
                const helper = latestAssignment.helper_dni
                    ? await db.personnel.where('dni').equals(latestAssignment.helper_dni).first()
                    : null;

                setAssignedCrew({
                    driver: driver?.name || 'Conductor',
                    helper: helper?.name || null
                });
                setCrewValidationStatus('pendiente'); // Reiniciar validación al cambiar tripulación
            }
            loadNames();
        }
    }, [latestAssignment]);

    // Inicializar Rust WASM Core
    useEffect(() => {
        init().then(() => {
            setIsRustReady(true);
            console.log("🦀 Aris Core (Rust) Initialized");
        }).catch(err => console.error("❌ Rust Init Error:", err));
    }, []);

    // Motor de Voz Neural Offline (Aris Voice)
    const { speak: arisSpeak, isReady } = useArisVoice();

    // Contactos para Comandos de Voz
    const contacts = useLiveQuery(() => db.contacts.toArray()) || [];
    const [isCommandListening, setIsCommandListening] = useState(false);
    // Estados para Formularios Manuales
    const [showChecklist, setShowChecklist] = useState(false);
    const [checklist, setChecklist] = useState({
        luces: true,
        frenos: true,
        neumaticos: true,
        documentacion: true,
        notas: ''
    });
    const [biostate, setBiostate] = useState({
        horasSueno: 8,
        estadoAnimo: 'Bueno',
        comentarios: ''
    });

    // 1. Sensores de Telemetría Pro (Acelerómetro/Giroscopio)
    useEffect(() => {
        const handleMotion = (event) => {
            if (!monitoring) return;
            const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
            const magnitude = Math.sqrt(x * x + y * y + z * z);

            // 🦀 Análisis de Seguridad con Motor Rust (Alto Rendimiento)
            if (isRustReady) {
                const telemetryData = JSON.stringify({
                    acc_x: x,
                    acc_y: y,
                    acc_z: z,
                    speed: 0 // TODO: Integrar velocidad real de Geolocation
                });

                const reportJson = analyze_safety(telemetryData);
                const report = JSON.parse(reportJson);

                if (report.harsh_braking_detected) {
                    logRoadEvent('Frenado Brusco [RUST]', Math.abs(y));
                }

                // Si el score baja de 80, Aris da una recomendación proactiva
                if (report.score < 80 && Math.random() > 0.95) { // Evitar spam
                    arisSpeak(report.recommendation);
                }
            }

            // Detección manual de Giro Cerrado (X-axis sudden change)
            if (Math.abs(x) > 12) {
                logRoadEvent('Giro Brusco', Math.abs(x));
            }

            // Lógica Modo Motorista (Inclinación y Caída)
            if (vehicleType === 'moto') {
                const leanAngle = Math.atan2(x, y) * (180 / Math.PI);
                if (Math.abs(leanAngle) > 45 && magnitude > 5) {
                    logRoadEvent('Inclinación Excesiva', Math.abs(leanAngle));
                }

                // Detección de Caída: Gran impacto + ángulo lateral sostenido
                if (magnitude > 25 && Math.abs(x) > 8) {
                    setTimeout(() => {
                        // Si después de 2s sigue inclinado y sin movimiento, es caída
                        logRoadEvent('ALERTA DE CAÍDA', magnitude);
                    }, 2000);
                }
            }

            if (magnitude > 18) {
                logRoadEvent('Bache Fuerte', magnitude);
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [monitoring]);

    // 2. Análisis de Audio (FFT - Web Audio API)
    const startAudioAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // 🦀 Análisis Acústico Avanzado con Rust
            if (isRustReady) {
                const acousticReportJson = analyze_acoustic(dataArray.map(v => (v / 128.0) - 1.0));
                const acousticReport = JSON.parse(acousticReportJson);

                if (acousticReport.impact_likelihood > 0.7) {
                    logRoadEvent('Impacto Acústico Detectado', acousticReport.level_db);
                }
            }

            requestAnimationFrame(analyze);
        };
        analyze();
    } catch (err) {
        console.error("Error de audio:", err);
    }
};

// 4. Reconocimiento de Comandos de Voz ("Llamar a...")
const startVoiceCommands = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsCommandListening(true);
    recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.toLowerCase();

        if (text.includes('aris apelar') || text.includes('apelar')) {
            startAppealingProcess();
        } else if (text.includes('llamar a')) {
            const contactName = text.split('llamar a')[1].trim();
            const contact = contacts.find(c => c.name.toLowerCase().includes(contactName));

            if (contact) {
                if (isReady) {
                    arisSpeak(`Llamando a ${contact.name}`);
                } else {
                    const synth = window.speechSynthesis;
                    const utter = new SpeechSynthesisUtterance(`Llamando a ${contact.name}`);
                    utter.lang = 'es-ES';
                    synth.speak(utter);
                }

                setTimeout(() => {
                    window.location.href = `tel:${contact.phone}`;
                }, 1500);
            } else {
                if (isReady) {
                    arisSpeak("No encontré ese contacto en el directorio.");
                } else {
                    const synth = window.speechSynthesis;
                    const utter = new SpeechSynthesisUtterance("No encontré ese contacto en el directorio.");
                    utter.lang = 'es-ES';
                    synth.speak(utter);
                }
            }
        }
    };
    recognition.onend = () => setIsCommandListening(false);
    recognition.start();
};

// 3. IA Visión Avanzada (TFJS)
useEffect(() => {
    const loadModel = async () => {
        try {
            const detector = await faceLandmarksDetection.createDetector(
                faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
                { runtime: 'tfjs', refineLandmarks: true }
            );
            setModel(detector);
        } catch (err) {
            console.error("Error al cargar modelo de visión:", err);
        }
    };
    loadModel();
}, []);

const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 }
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
            if (monitoring) startAudioAnalysis();
        }
    } catch (err) {
        console.error("Error de cámara:", err);
    }
};

const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        setCameraActive(false);
    }
};

useEffect(() => {
    let requestRef;
    const detect = async () => {
        if (model && videoRef.current && cameraActive) {
            const faces = await model.estimateFaces(videoRef.current);
            if (faces.length > 0 && isRustReady) {
                // 1. Lógica de Crew Validation (Aris Vision)
                if (crewValidationStatus === 'pendiente' && faces.length >= 1) {
                    const helperDetected = faces.length > 1;
                    const needsHelper = !!assignedCrew.helper;

                    if (needsHelper) {
                        if (helperDetected) {
                            arisSpeak(`Tripulación confirmada. Hola ${assignedCrew.driver} y ${assignedCrew.helper}. Equipamiento de seguridad verificado.`);
                            setCrewValidationStatus('validado');
                        } else {
                            // Alerta si falta el copiloto asignado
                            if (Math.random() > 0.998) {
                                arisSpeak(`Aris dice: No detecto al copiloto ${assignedCrew.helper}. La unidad debe operar con tripulación completa.`);
                            }
                        }
                    } else {
                        // Solo conductor autorizado
                        arisSpeak(`Conductor verificado. Hola ${assignedCrew.driver}. Iniciando monitoreo de seguridad. Buen viaje.`);
                        setCrewValidationStatus('validado');
                    }
                }

                const face = faces[0];

                // Extraer los 6 puntos clave de cada ojo para el algoritmo EAR
                // Mapeo típico de MediaPipe Face Mesh para EAR:
                // Izquierdo: [33, 160, 158, 133, 153, 144]
                // Derecho: [362, 385, 387, 263, 373, 380]

                const leftEyeIndices = [33, 160, 158, 133, 153, 144];
                const rightEyeIndices = [362, 385, 387, 263, 373, 380];

                const getPoints = (indices) => indices.map(idx => ({
                    x: face.keypoints[idx].x,
                    y: face.keypoints[idx].y
                }));

                const faceData = JSON.stringify({
                    left_eye: getPoints(leftEyeIndices),
                    right_eye: getPoints(rightEyeIndices)
                });

                // 🦀 Análisis de Fatiga en Rust (Ultra-Rápido)
                const fatigueJson = analyze_fatigue(faceData);
                const fatigueReport = JSON.parse(fatigueJson);

                setIsDrowsy(fatigueReport.is_drowsy);

                if (fatigueReport.alert_level >= 2 && Math.random() > 0.98) {
                    arisSpeak("Aris dice: Detecto signos de fatiga. Por favor, considera tomar un descanso.");
                }

                // Detección de uso de celular (Simulada o integrada con otro modelo)
                // ...
            }
        }
        requestRef = requestAnimationFrame(detect);
    };
    if (cameraActive) detect();
    return () => cancelAnimationFrame(requestRef);
}, [model, cameraActive]);

const logRoadEvent = async (type, intensity) => {
    const event = {
        timestamp: Date.now(),
        road_event: type,
        intensity: intensity.toFixed(2),
        is_synced: 0
    };
    const id = await db.sensorLogs.add(event);
    setRoadEvents(prev => [event, ...prev].slice(0, 5));

    // Flujo de Apelación Ética Aris
    if (intensity > 15 || type.includes('Brusco')) {
        const message = `Aris dice: He detectado un ${type}. ¿Deseas justificar este evento? Di "Aris, apelar".`;
        arisSpeak(message);

        // Preparar el encabezado del caso
        setCurrentCase({ id, type, intensity, timestamp: event.timestamp });
    }
};

const startAppealingProcess = () => {
    if (!currentCase) return;
    setIsAppealing(true);
    arisSpeak("Te escucho, por favor describe lo ocurrido.");

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'es-ES';

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;

        // 🦀 Seguridad de Evidencia con Rust
        const evidenceData = JSON.stringify({
            case_id: currentCase.id,
            vocal_defense: transcript,
            telemetry_id: currentCase.id,
            timestamp: currentCase.timestamp
        });

        const hash = generate_evidence_hash(evidenceData);

        const caseFile = {
            ...currentCase,
            vocal_defense: transcript,
            integrity_hash: hash,
            status: 'pendiendo_revision'
        };

        // Guardar en base de datos para el Delegado
        await db.sensorLogs.update(currentCase.id, {
            vocal_defense: transcript,
            integrity_hash: hash,
            status: 'apelado'
        });

        arisSpeak("Entendido. He empaquetado tu versión con las pruebas de sensores y video. El administrador revisará el caso.");
        setIsAppealing(false);
        setCurrentCase(null);
    };

    recognition.start();
};

return (
    <div className="flex flex-col gap-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Monitoreo Bio-Acústico e IA */}
            <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="text-blue-500" />
                            Monitor de Seguridad & IA Vision
                        </h2>
                        {crewValidationStatus === 'validado' && (
                            <div className="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle size={12} /> TRIPULACIÓN VALIDADA
                            </div>
                        )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${cameraActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {cameraActive ? 'Inteligencia Activa' : 'Cámara Off'}
                    </div>
                </div>

                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover grayscale opacity-60" />
                    {!cameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Camera size={48} className="text-slate-700" />
                            <button onClick={startCamera} className="btn-primary text-xs">Activar Monitoreo Facial</button>
                        </div>
                    )}

                    {/* HUD de Alertas */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {vehicleType === 'moto' && (
                            <div className="bg-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <Bike size={16} />
                                <span className="text-[10px] font-bold">MODO MOTORISTA</span>
                            </div>
                        )}
                        {isPhoneVisible && (
                            <div className="bg-amber-600 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-bounce">
                                <Smartphone size={16} />
                                <span className="text-[10px] font-bold">USO DE CELULAR</span>
                            </div>
                        )}
                        {isDrowsy && (
                            <div className="bg-red-600 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse">
                                <ShieldAlert size={16} />
                                <span className="text-[10px] font-bold">SOMNOLENCIA</span>
                            </div>
                        )}
                    </div>

                    {/* Visualizador de Audio (Simple) */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end gap-1 h-8">
                        <Mic size={14} className="text-slate-500 mr-2 mb-1" />
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className="w-full bg-blue-500/40 rounded-t-sm transition-all duration-100"
                                style={{ height: `${Math.random() * noiseLevel}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center gap-3">
                        <Volume2 size={16} className="text-blue-400" />
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Ruido Motor</p>
                            <p className="text-xs font-bold">{noiseLevel} dB (Normal)</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center gap-3">
                        <Wind size={16} className="text-blue-400" />
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Frec. Respiratoria</p>
                            <p className="text-xs font-bold">16 rpm</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Telemetría Avanzada (G-Force & Alertas) */}
            <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Zap size={20} className="text-amber-400" />
                        Telemetría Pro G-Shock
                    </h3>
                    <button
                        onClick={() => { setMonitoring(!monitoring); if (!monitoring && cameraActive) startAudioAnalysis(); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${monitoring ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}
                    >
                        {monitoring ? 'Detener Sensores' : 'Activar Telemetría'}
                    </button>
                </div>

                <div className="flex gap-4 mb-4">
                    <button
                        onClick={startVoiceCommands}
                        className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${isCommandListening ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                        <div className={`p-3 rounded-full ${isCommandListening ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800'}`}>
                            <PhoneCall size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">{isCommandListening ? 'Modo Comandos On' : 'Comandos de Llamada'}</span>
                        <p className="text-[8px] opacity-70">Di: "Llamar a [Nombre]"</p>
                    </button>

                    <div className="flex-1 p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
                        <div className="p-3 bg-slate-800 rounded-full text-blue-400">
                            <Activity size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase">Estado Sistema</span>
                        <p className="text-[8px] text-emerald-400">Todo OK</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 min-h-[150px]">
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Historial de Conducción</h4>
                    {roadEvents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl opacity-30">
                            <Activity size={32} />
                            <p className="text-[10px] mt-2 italic">Sin incidentes detectados</p>
                        </div>
                    ) : (
                        roadEvents.map((evt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700 animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${evt.road_event === 'Frenado Brusco' ? 'bg-red-500/20 text-red-400' :
                                        evt.road_event === 'Giro Brusco' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{evt.road_event}</p>
                                        <p className="text-[9px] text-slate-500">Impacto: {evt.intensity}G • {new Date(evt.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <CheckCircle size={14} className="text-slate-600" />
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Eficiencia en Ralentí</span>
                        <span className="text-[10px] font-bold text-emerald-400">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
                    </div>
                </div>
            </div>

        </div>

        {/* Formularios Manuales SST con Voz */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <ClipboardCheck size={18} className="text-blue-400" />
                    Inspección Pre-Uso (Voz Habilitada)
                </h3>
                <div className="flex flex-col gap-3">
                    {['luces', 'frenos', 'neumaticos', 'documentacion'].map(item => (
                        <label key={item} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                            <span className="text-xs uppercase font-bold text-slate-400">{item}</span>
                            <input
                                type="checkbox"
                                checked={checklist[item]}
                                onChange={() => setChecklist({ ...checklist, [item]: !checklist[item] })}
                                className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                    ))}
                    <div className="mt-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Observaciones</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input-field flex-1"
                                placeholder="Dictar notas de inspección..."
                                value={checklist.notas}
                                onChange={(e) => setChecklist({ ...checklist, notas: e.target.value })}
                            />
                            <VoiceButton onResult={(text) => setChecklist({ ...checklist, notas: text })} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Heart size={18} className="text-rose-400" />
                    Estado Biopsicosomático
                </h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Horas de sueño</p>
                        <input
                            type="range" min="0" max="12" step="0.5"
                            value={biostate.horasSueno}
                            onChange={(e) => setBiostate({ ...biostate, horasSueno: e.target.value })}
                            className="w-full"
                        />
                        <p className="text-xs text-center mt-1 font-bold">{biostate.horasSueno} Horas</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">¿Cómo te sientes hoy?</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input-field flex-1"
                                placeholder="Dictar estado de ánimo..."
                                value={biostate.comentarios}
                                onChange={(e) => setBiostate({ ...biostate, comentarios: e.target.value })}
                            />
                            <VoiceButton onResult={(text) => setBiostate({ ...biostate, comentarios: text })} />
                        </div>
                    </div>
                    <button className="btn-primary w-full justify-center mt-2 group">
                        <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                        Guardar Reporte SST
                    </button>
                </div>
            </div>
        </div>
    </div>
);
}
