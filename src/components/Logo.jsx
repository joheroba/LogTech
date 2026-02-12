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
                <rect width="100" height="100" rx="24" fill="url(#aris_grad)" />

                {/* Forma Abstracta: "A" Futurista / Camino */}
                <path
                    d="M50 20L80 80H65L50 45L35 80H20L50 20Z"
                    fill="white"
                    fillOpacity="0.1"
                />

                {/* Trazo Principal "A" de Aris */}
                <path
                    d="M25 80L50 25L75 80"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M38 60H62"
                    stroke="#22D3EE"
                    strokeWidth="8"
                    strokeLinecap="round"
                />

                {/* Detalle Tecnológico: Nodos de conexión */}
                <circle cx="50" cy="25" r="4" fill="#22D3EE" />
                <circle cx="25" cy="80" r="4" fill="#22D3EE" />
                <circle cx="75" cy="80" r="4" fill="#22D3EE" />

                <defs>
                    <linearGradient
                        id="aris_grad"
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
            <span className="text-2xl font-black italic tracking-tighter text-white">
                AR<span className="text-cyan-400">IS</span>
            </span>
        </div>
    );
}
