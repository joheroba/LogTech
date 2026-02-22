use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use rustfft::{FftPlanner, num_complex::Complex};

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

#[derive(Serialize, Deserialize)]
pub struct FaceData {
    pub left_eye: Vec<Point>,
    pub right_eye: Vec<Point>,
}

#[derive(Serialize, Deserialize)]
pub struct FatigueReport {
    pub ear: f32,
    pub is_drowsy: bool,
    pub alert_level: i32,
}

#[derive(Serialize, Deserialize)]
pub struct TelemetryData {
    pub acc_x: f32,
    pub acc_y: f32,
    pub acc_z: f32,
    pub speed: f32,
}

#[derive(Serialize, Deserialize)]
pub struct SafetyReport {
    pub score: i32,
    pub harsh_braking_detected: bool,
    pub recommendation: String,
}

#[derive(Serialize, Deserialize)]
pub struct AcousticReport {
    pub stress_detected: bool,
    pub impact_likelihood: f32,
    pub level_db: f32,
}

#[derive(Serialize, Deserialize)]
pub struct EvidenceHeader {
    pub hash: String,
    pub timestamp: f64,
    pub device_id: String,
}

fn calculate_ear(eye: &[Point]) -> f32 {
    if eye.len() < 6 { return 1.0; }
    
    // Distancias verticales
    let p2_p6 = ((eye[1].x - eye[5].x).powi(2) + (eye[1].y - eye[5].y).powi(2)).sqrt();
    let p3_p5 = ((eye[2].x - eye[4].x).powi(2) + (eye[2].y - eye[4].y).powi(2)).sqrt();
    
    // Distancia horizontal
    let p1_p4 = ((eye[0].x - eye[3].x).powi(2) + (eye[0].y - eye[3].y).powi(2)).sqrt();
    
    if p1_p4 == 0.0 { return 1.0; }
    
    (p2_p6 + p3_p5) / (2.0 * p1_p4)
}

#[wasm_bindgen]
pub fn analyze_fatigue(face_json: &str) -> String {
    let face: FaceData = serde_json::from_str(face_json).unwrap_or(FaceData {
        left_eye: vec![],
        right_eye: vec![],
    });

    let left_ear = calculate_ear(&face.left_eye);
    let right_ear = calculate_ear(&face.right_eye);
    let avg_ear = (left_ear + right_ear) / 2.0;

    let is_drowsy = avg_ear < 0.26;

    let report = FatigueReport {
        ear: avg_ear,
        is_drowsy,
        alert_level: if avg_ear < 0.20 { 3 } else if avg_ear < 0.26 { 2 } else { 0 },
    };

    serde_json::to_string(&report).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn analyze_safety(data_json: &str) -> String {
    let data: TelemetryData = serde_json::from_str(data_json).unwrap_or(TelemetryData {
        acc_x: 0.0,
        acc_y: 0.0,
        acc_z: 0.0,
        speed: 0.0,
    });

    let mut score = 100;
    let mut harsh_braking = false;

    if data.acc_y < -4.5 {
        score -= 20;
        harsh_braking = true;
    }

    if data.speed > 90.0 {
        score -= 10;
    }

    let report = SafetyReport {
        score: score.max(0),
        harsh_braking_detected: harsh_braking,
        recommendation: if harsh_braking {
            "Aris dice: Has frenado muy brusco. Mantén mayor distancia de seguridad.".to_string()
        } else if score < 90 {
            "Aris dice: Tu velocidad es alta. Reduce para mejorar tu score.".to_string()
        } else {
            "Aris dice: Conducción perfecta. ¡Sigue así!".to_string()
        },
    };

    serde_json::to_string(&report).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn analyze_acoustic(audio_data: &[f32]) -> String {
    if audio_data.is_empty() { return "{}".to_string(); }
    
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(audio_data.len());
    
    let mut buffer: Vec<Complex<f32>> = audio_data.iter().map(|&x| Complex { re: x, im: 0.0 }).collect();
    fft.process(&mut buffer);

    let energy: f32 = audio_data.iter().map(|x| x * x).sum::<f32>() / audio_data.len() as f32;
    let level_db = if energy > 0.0 { 10.0 * energy.log10() } else { -100.0 };

    let report = AcousticReport {
        stress_detected: level_db > -20.0,
        impact_likelihood: if level_db > -10.0 { 0.8 } else { 0.1 },
        level_db,
    };

    serde_json::to_string(&report).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn generate_evidence_hash(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}
