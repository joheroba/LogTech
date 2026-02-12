import Dexie from 'dexie';

export const db = new Dexie('LogTechDB');

db.version(1).stores({
    vehicles: '++id, plate, company_ruc, is_synced',
    personnel: '++id, dni, role, is_synced',
    routes: '++id, client_name, is_synced',
    inspections: '++id, vehicle_plate, driver_dni, date_time, is_synced',
    health: '++id, person_dni, timestamp, is_synced',
    expenses: '++id, vehicle_plate, date, category, is_synced',
    liquidations: '++id, plateau, status, is_synced',
    sensorLogs: '++id, timestamp, road_event, driver_state, is_synced',
    contacts: '++id, name, phone, type, is_synced',
    features: 'id, name, description, is_enabled, impact, recommendation',
    podcasts: '++id, title, content, category',
    insurance_reports: '++id, person_dni, safety_index, validated_at'
});

// Initial seed data for demonstration
export async function seedDatabase() {
    const vehicleCount = await db.vehicles.count();
    if (vehicleCount === 0) {
        await db.vehicles.bulkAdd([
            { plate: 'ABC-123', model: 'Volvo FH16', soat_expiry: '2026-12-31', company_ruc: '20123456789', is_synced: 1 },
            { plate: 'XYZ-789', model: 'Scania R500', soat_expiry: '2026-06-15', company_ruc: '20987654321', is_synced: 1 }
        ]);

        await db.personnel.bulkAdd([
            { name: 'Juan Perez', dni: '12345678', role: 'Chofer', is_synced: 1 },
            { name: 'Carlos Gomez', dni: '87654321', role: 'Ayudante', is_synced: 1 }
        ]);

        await db.contacts.bulkAdd([
            { name: 'Central de Emergencias', phone: '911', type: 'Emergencia', is_synced: 1 },
            { name: 'Administración LogTech', phone: '+51987654321', type: 'Administrador', is_synced: 1 },
            { name: 'Soporte Mecánico', phone: '0800-12345', type: 'Administrador', is_synced: 1 }
        ]);

        await db.features.bulkAdd([
            {
                id: 'attendance',
                name: 'Módulo de Asistencia',
                description: 'Control de entrada y salida con geolocalización.',
                is_enabled: false,
                impact: 'Reduce el ausentismo y centraliza el control de ingresos.',
                recommendation: 'Recomendado para flotas de +5 conductores.'
            },
            {
                id: 'bonuses',
                name: 'Módulo de Incentivos',
                description: 'Cálculo automático de bonos y penalidades por desempeño.',
                is_enabled: false,
                impact: 'Mejora la seguridad vial mediante gamificación.',
                recommendation: 'Activar cuando se requiera estandarizar el pago de variables.'
            },
            {
                id: 'telemetry_pro',
                name: 'Telemetría Pro (Audio/IA)',
                description: 'Análisis de ruidos de motor y detección de fatiga por IA.',
                is_enabled: false,
                impact: 'Previene fallas mecánicas graves y accidentes por cansancio.',
                recommendation: 'Esencial para rutas largas u operaciones críticas.'
            },
            {
                id: 'auditor',
                name: 'Delegación de Auditoría',
                description: 'Habilita el rol de Auditor para validar gastos y liquidaciones.',
                is_enabled: false,
                impact: 'Libera al Administrador del control manual de boletas.',
                recommendation: 'Recomendado cuando el volumen de gastos supere las 50 facturas/semana.'
            },
            {
                id: 'podcast_edu',
                name: 'Módulo de Podcast',
                description: 'Capacitación manos libres mediante audio TTS.',
                is_enabled: true,
                impact: 'Aumenta el conocimiento normativo sin detener la operación.',
                recommendation: 'Ideal para difundir cambios en rutas o normativas SST.'
            },
            {
                id: 'insurance_pro',
                name: 'Certificación para Seguros',
                description: 'Generación de reportes de seguridad para aseguradoras.',
                is_enabled: false,
                impact: 'Permite negociar primas de seguros más bajas con datos reales.',
                recommendation: 'Activar cuando se tenga al menos 3 meses de data de telemetría.'
            }
        ]);

        await db.podcasts.bulkAdd([
            {
                title: 'Conducción en Lluvia',
                content: 'En condiciones de lluvia, aumenta la distancia de frenado al doble. Evita giros bruscos y mantén las luces encendidas en todo momento.',
                category: 'Seguridad'
            },
            {
                title: 'Optimización de Combustible',
                content: 'Mantener una velocidad constante y evitar aceleraciones bruscas puede ahorrar hasta un 15% de combustible en rutas largas.',
                category: 'Eficiencia'
            }
        ]);
    }
}
