import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Navigation,
    Truck,
    Map as MapIcon,
    DownloadCloud,
    Mic,
    Info,
    Navigation2,
    AlertTriangle,
    Flag
} from 'lucide-react';
import { db } from '../db';
import useArisVoice from '../hooks/useArisVoice';
import { getTilesInBBox, downloadTiles } from '../services/MapTileManager';

// IMPORTANTE: El usuario debe proporcionar su propio token de Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoiam9oZXJvYmEiLCJhIjoiY203Znh5NnA3MGFrZTJrcHg3eG9mbGFrayJ9.placeholder';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function NavigationModule() {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [currentPos, setCurrentPos] = useState([-77.0428, -12.0464]); // Lima como default
    const [isOfflineReady, setIsOfflineReady] = useState(false);
    const [adminSyncStatus, setAdminSyncStatus] = useState('En espera');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const { speak: arisSpeak } = useArisVoice();

    useEffect(() => {
        if (!mapContainerRef.current) return;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: currentPos,
            zoom: 14,
            pitch: 45
        });

        mapRef.current.on('load', () => {
            console.log('🗺️ Mapbox cargado correctamente');
            arisSpeak("Aris Way activado. Lista para guiar tu ruta logística.");
        });

        // Geolocalización en tiempo real
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { longitude, latitude } = pos.coords;
                setCurrentPos([longitude, latitude]);
                if (mapRef.current) {
                    mapRef.current.setCenter([longitude, latitude]);
                }
            },
            (err) => console.error("Error GPS:", err),
            { enableHighAccuracy: true }
        );

        return () => {
            if (mapRef.current) mapRef.current.remove();
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const simulateAdminSync = async () => {
        setAdminSyncStatus('Calculando Tiles...');
        arisSpeak("Calculando área de cobertura para la ruta asignada.");

        // Simulación de puntos de inicio y fin para la demo (Radio de 2km en Lima)
        const start = [-77.0428, -12.0464];
        const end = [-77.0300, -12.0550];

        const tiles = getTilesInBBox(start, end, 14); // Tiles a zoom 14

        setAdminSyncStatus(`Descargando ${tiles.length} tiles...`);
        arisSpeak(`Iniciando descarga de ${tiles.length} segmentos de mapa para modo offline.`);

        try {
            await downloadTiles(tiles, 'mapbox://styles/mapbox/navigation-night-v1', MAPBOX_TOKEN, (p) => {
                setDownloadProgress(p);
            });

            setAdminSyncStatus('Sincronizado ✅');
            setIsOfflineReady(true);
            setDownloadProgress(100);
            arisSpeak("Sincronización completa. Mapas y rutas críticas guardados en la caché local del dispositivo.");
        } catch (err) {
            setAdminSyncStatus('Error ⚠️');
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in h-[calc(100vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                {/* Panel Lateral: Estado y Aris Way */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <div className="glass-card p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                                <Navigation size={20} />
                                Aris Way
                            </h3>
                            <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">
                                GPS: ACTIVO
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 uppercase font-bold">Admin-Sync Status</span>
                                <span className="text-xs font-bold text-emerald-400">{adminSyncStatus}</span>
                            </div>

                            {downloadProgress > 0 && downloadProgress < 100 && (
                                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full transition-all duration-300"
                                        style={{ width: `${downloadProgress}%` }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={simulateAdminSync}
                                className="btn-secondary w-full justify-center gap-2 mt-2"
                            >
                                <DownloadCloud size={16} />
                                Sincronizar Ruta
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                                <Truck size={18} className="text-amber-400" />
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Vehículo</p>
                                    <p className="text-xs font-bold font-mono">CARGA PESADA (15T)</p>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                                <Flag size={18} className="text-blue-400" />
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Próximo Punto</p>
                                    <p className="text-xs font-bold">Ventas Huánuco (Almacén B)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex-1 overflow-y-auto">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Mic size={16} className="text-blue-400" />
                            Aris Narrador En Ruta
                        </h4>
                        <div className="flex flex-col gap-4">
                            <div className="p-3 bg-blue-600/10 border-l-2 border-blue-500 rounded-r-lg">
                                <p className="text-xs italic text-blue-200">
                                    "Aris dice: En 500 metros gira a la izquierda. Recuerda que ese puente tiene altura restringida, mantente en el carril central."
                                </p>
                            </div>
                            <div className="p-3 bg-slate-900/50 border-l-2 border-slate-700 rounded-r-lg">
                                <p className="text-xs text-slate-400">
                                    Reporte de Comunidad: "Bache profundo detectado 2km adelante por un colega".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mapa Principal */}
                <div className="lg:col-span-2 relative glass-card p-0 overflow-hidden border-2 border-slate-800 rounded-3xl min-h-[400px]">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {/* HUD Superpuesto */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 font-bold">VELOCIDAD</span>
                                <span className="text-2xl font-black text-white">45</span>
                                <span className="text-[8px] text-slate-500 font-bold">KM/H</span>
                            </div>
                            <div className="w-px h-10 bg-slate-800" />
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 font-bold">ETA</span>
                                <span className="text-2xl font-black text-blue-400">14:50</span>
                                <span className="text-[8px] text-slate-500 font-bold">MIN</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerta de Ruta */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs">
                        <div className="bg-red-600/90 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                            <div className="p-2 bg-white/20 rounded-full text-white">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white">RESTRICCIÓN DE PESO</p>
                                <p className="text-[10px] text-white/80">Desvío sugerido por Aris en 300m</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
