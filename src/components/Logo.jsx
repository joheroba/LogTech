import React from 'react';

export default function Logo({ size = 40, className = "" }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            >
                {/* Fondo Stylizado */}
                <rect width="100" height="100" rx="24" fill="url(#logo_grad)" />

                {/* Forma Abstracta: Ala / Camión Futurista */}
                <path
                    d="M25 35L75 35L65 65L15 65L25 35Z"
                    fill="white"
                    fillOpacity="0.1"
                />
                <path
                    d="M30 45H80L70 75H20L30 45Z"
                    fill="white"
                    fillOpacity="0.2"
                />

                {/* Trazo Principal "L" de LogTech */}
                <path
                    d="M35 25V75H75"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Detalle Tecnológico: Líneas de Circuito */}
                <circle cx="75" cy="75" r="5" fill="#22D3EE" />
                <path
                    d="M75 55V65"
                    stroke="#22D3EE"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                <defs>
                    <linearGradient
                        id="logo_grad"
                        x1="0"
                        y1="0"
                        x2="100"
                        y2="100"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#0F172A" />
                        <stop offset="1" stopColor="#1E293B" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="text-xl font-black italic tracking-tighter text-white">
                LOG<span className="text-cyan-400">TECH</span>
            </span>
        </div>
    );
}
