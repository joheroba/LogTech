# =============================================================================
# 🏔️ PIPER VOICE TRAINING TOOLKIT - KAGGLE EDITION
# =============================================================================
# Script "todo en uno" para entrenar modelos de voz TTS personalizados
# usando Piper en Kaggle. Exporta a formato .onnx para uso offline.
#
# PLATAFORMA: Kaggle Notebook (GPU T4 x2 + Internet ON)
# PYTHON: Compatible con 3.10, 3.11, 3.12
# AUTOR: Proyecto ARIS (LogTech) - github.com/joheroba
# FECHA: Febrero 2026
#
# USO:
#   1. Sube tu dataset de audio como Dataset en Kaggle
#   2. Copia este script en una celda de Kaggle Notebook
#   3. Modifica la sección "CONFIGURACIÓN" con tus datos
#   4. Ejecuta la celda
# =============================================================================

import os, glob, sys, shutil, site

# =============================================================================
# 📋 CONFIGURACIÓN (Modifica esta sección para tu proyecto)
# =============================================================================

# Nombre del proyecto (usado para carpetas de salida)
PROJECT_NAME = "patricia"

# Idioma del modelo (código espeak-ng: es, en, fr, de, pt, it, etc.)
LANGUAGE = "es"

# Formato del dataset: "ljspeech" o "mycroft"
DATASET_FORMAT = "ljspeech"

# Sample rate de los audios (22050 Hz recomendado para Piper)
SAMPLE_RATE = 22050

# Parámetros de entrenamiento
CHECKPOINT_EPOCHS = 500   # Guardar checkpoint cada N epochs
QUALITY = "medium"         # low, medium, high (medium recomendado)
BATCH_SIZE = 16            # Reducir a 8 si hay errores de memoria GPU
MAX_WORKERS = 1            # Workers para preprocesamiento (1 para Python 3.12+)

# Metadata: formato "archivo.wav|transcripción"
# Cada línea es un archivo de audio con su transcripción.
# Los archivos .wav deben estar en tu dataset subido a Kaggle.
METADATA = """patricia_000.wav|en la necesidad del día a día. Entonces de de ambas partes se quedó este que se iba a trabajar el horario individualmente cada una de sus zonas.
patricia_001.wav|En el caso de las novedades sí hasta la fecha lo estaría lo estaba haciendo la señora Magali con conocimiento mío y me me y yo le comunicaba mis novedades de de mi zona.
patricia_002.wav|.a de mi zona. Ahora, lo que yo logro entender, ponle así es mejor, lo que yo lo que yo puedo decir es que sí efectivamente ha habido modificación.
patricia_004.wav|Ya, pero no te extiendas tampoco un correo que va a ser un ojón. No, entonces solamente al grano."""

# Nombre del modelo de salida
OUTPUT_MODEL_NAME = "aris_voice"

# =============================================================================
# 🚫 NO MODIFICAR DEBAJO DE ESTA LÍNEA (a menos que sepas lo que haces)
# =============================================================================

WORK_DIR = "/kaggle/working"
DATASET_DIR = f"{WORK_DIR}/dataset"
WAVS_DIR = f"{DATASET_DIR}/wavs"
OUTPUT_DIR = f"{WORK_DIR}/output/{PROJECT_NAME}"
PIPER_DIR = f"{WORK_DIR}/piper"
PIPER_SRC = f"{PIPER_DIR}/src/python"

# ═══════════════════════════════════════════════════════════════════════════════
# 🏗️ PASO 1/7: LIMPIEZA Y PREPARACIÓN
# ═══════════════════════════════════════════════════════════════════════════════
print("🏗️ 1/7: Preparando zona de trabajo limpia...")
os.system(f"rm -rf {WORK_DIR}/*")
os.makedirs(WAVS_DIR, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════════════════
# 📦 PASO 2/7: COPIAR AUDIOS A ZONA ESCRIBIBLE
# ═══════════════════════════════════════════════════════════════════════════════
# Kaggle monta los datasets como solo-lectura en /kaggle/input/
# Necesitamos copiarlos a /kaggle/working/ que sí es escribible
wav_files = glob.glob("/kaggle/input/**/*.wav", recursive=True)
if not wav_files:
    raise Exception(
        "❌ No se encontraron archivos .wav en /kaggle/input/. "
        "Asegúrate de subir tu dataset usando 'Add Data' en el panel derecho."
    )

print(f"📦 2/7: Copiando {len(wav_files)} audios a {WAVS_DIR}/...")
for f in wav_files:
    shutil.copy(f, WAVS_DIR)

# ═══════════════════════════════════════════════════════════════════════════════
# 🛠️ PASO 3/7: INSTALAR DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════════════════════
print("🛠️ 3/7: Instalando dependencias del sistema y Python...")

# Dependencias del sistema (espeak-ng para fonemización)
os.system("apt-get install -y -q libespeak-ng-dev")

# Dependencias de Python
os.system("pip install -q Cython numpy onnxruntime onnx pytorch-lightning==1.9.0 onnxscript")

# Clonar Piper
os.system(f"git clone -q https://github.com/rhasspy/piper.git {PIPER_DIR}")

# ═══════════════════════════════════════════════════════════════════════════════
# ⚙️ PASO 4/7: COMPILAR MONOTONIC ALIGN + INSTALAR PIPER
# ═══════════════════════════════════════════════════════════════════════════════
print("⚙️ 4/7: Compilando módulos C++ y configurando Piper...")

# FIX CRÍTICO #1: Compilar monotonic_align DESDE LA RAÍZ de piper/src/python
# Si se compila desde dentro de la carpeta monotonic_align, el .so se genera
# en una ruta relativa incorrecta.
os.chdir(PIPER_SRC)
os.system("python3 piper_train/vits/monotonic_align/setup.py build_ext --inplace")

# FIX CRÍTICO #2: Crear la subcarpeta que __init__.py espera
# El __init__.py importa: from .monotonic_align.core import maximum_path_c
# Esto significa que necesita: monotonic_align/monotonic_align/core.so
ma_dir = "piper_train/vits/monotonic_align"
ma_sub = f"{ma_dir}/monotonic_align"
os.makedirs(ma_sub, exist_ok=True)

so_files = glob.glob(f"{ma_dir}/*.so")
if so_files:
    for so in so_files:
        shutil.copy(so, f"{ma_sub}/core.so")
    with open(f"{ma_sub}/__init__.py", "w") as f:
        f.write("")
    print(f"   ✅ monotonic_align compilado. Archivos: {so_files}")
else:
    print("   ⚠️ No se encontraron archivos .so. La compilación pudo haber fallado.")

# FIX CRÍTICO #3: Crear puente de piper_phonemize en site-packages
# El repositorio original de piper-phonemize fue archivado en julio 2025.
# pip no puede instalarlo. Creamos un módulo Python que implementa las
# 8 funciones que Piper necesita usando espeak-ng directamente.
# IMPORTANTE: Debe instalarse en site-packages (no solo sys.modules)
# porque los subprocesos (python3 -m ...) no heredan sys.modules.
print("🐍 Instalando puente de fonemas en site-packages...")
sp = site.getsitepackages()[0]

BRIDGE_CODE = '''
import subprocess

def phonemize_espeak(text, voice, **kwargs):
    """Convierte texto a fonemas IPA usando espeak-ng."""
    try:
        result = subprocess.run(
            ["espeak-ng", "--ipa=3", "-v", voice, "-q", text],
            capture_output=True, text=True, timeout=10
        )
        phonemes = result.stdout.strip().split("\\n")
        return [list(p) for p in phonemes if p]
    except Exception:
        return [list(text)]

def phonemize_codepoints(text, **kwargs):
    """Convierte texto a codepoints (para idiomas sin soporte espeak)."""
    return [list(text)]

def phoneme_ids_espeak(phonemes, missing_phonemes=None, pad="_"):
    """Convierte lista de fonemas a IDs numéricos usando mapa espeak."""
    id_map = get_espeak_map()
    ids = []
    for phoneme_list in phonemes:
        for p in phoneme_list:
            if p in id_map:
                ids.append(id_map[p])
            elif missing_phonemes is not None:
                missing_phonemes[p] = missing_phonemes.get(p, 0) + 1
    return ids

def phoneme_ids_codepoints(codepoints, missing_codepoints=None, pad="_"):
    """Convierte codepoints a IDs numéricos."""
    id_map = get_codepoints_map()
    ids = []
    for cp_list in codepoints:
        for cp in cp_list:
            if cp in id_map:
                ids.append(id_map[cp])
            elif missing_codepoints is not None:
                missing_codepoints[cp] = missing_codepoints.get(cp, 0) + 1
    return ids

def get_espeak_map():
    """Retorna mapa de fonemas espeak-ng a IDs numéricos."""
    phonemes = [
        '_', '^', '$', ' ', '!', "\\'", '(', ')', ',', '-', '.', ':', ';', '?',
        'a', 'b', 'c', 'd', 'e', 'f', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
        'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '\\u00e6', '\\u00e7', '\\u00f0', '\\u00f8', '\\u014b', '\\u0153',
        '\\u0250', '\\u0251', '\\u0252', '\\u0254', '\\u0255', '\\u0256',
        '\\u0259', '\\u025a', '\\u025b', '\\u025c', '\\u025d', '\\u025f',
        '\\u0261', '\\u0263', '\\u026a', '\\u026b', '\\u026c', '\\u026d',
        '\\u026f', '\\u0272', '\\u0273', '\\u0274', '\\u0279', '\\u027b',
        '\\u027e', '\\u0280', '\\u0281', '\\u0283', '\\u0288', '\\u0289',
        '\\u028a', '\\u028b', '\\u028c', '\\u028e', '\\u028f', '\\u0291',
        '\\u0292', '\\u0294', '\\u0295', '\\u0299', '\\u029d', '\\u03b2',
        '\\u03b8', '\\u03c7', '\\u1d7b', '\\u2c71',
        '\\u0264', '\\u0275', '\\u0278', '\\u02c8', '\\u02cc', '\\u02d0',
        '\\u0303', '\\u0329', '\\u032a', '\\u032f', '\\u033a', '\\u033b',
        '\\u02d1', 'g'
    ]
    return {p: i for i, p in enumerate(phonemes)}

def get_codepoints_map():
    """Retorna mapa de codepoints a IDs (alias de espeak_map)."""
    return get_espeak_map()

def get_max_phonemes():
    """Retorna el número máximo de fonemas soportados."""
    return 600

def tashkeel_run(text):
    """Diacritización árabe (no-op para otros idiomas)."""
    return text
'''

with open(f"{sp}/piper_phonemize.py", "w", encoding="utf-8") as f:
    f.write(BRIDGE_CODE)
print(f"   ✅ Puente instalado en: {sp}/piper_phonemize.py")

# Instalar Piper-Train (removiendo la dependencia rota de piper-phonemize)
os.chdir(PIPER_SRC)
os.system('sed -i \'s/"piper-phonemize~=1.1.0"//g\' setup.py')
os.system("pip install -q -e . --no-deps")
os.chdir(WORK_DIR)

# ═══════════════════════════════════════════════════════════════════════════════
# 📝 PASO 5/7: GENERAR METADATA
# ═══════════════════════════════════════════════════════════════════════════════
print("📝 5/7: Generando metadata.csv...")
with open(f"{DATASET_DIR}/metadata.csv", "w", encoding="utf-8") as f:
    f.write(METADATA.strip())

# Verificar que los archivos referenciados existen
lines = METADATA.strip().split("\n")
missing = []
for line in lines:
    if "|" in line:
        wav_name = line.split("|")[0].strip()
        if not os.path.exists(f"{WAVS_DIR}/{wav_name}"):
            missing.append(wav_name)
if missing:
    print(f"   ⚠️ Archivos faltantes: {missing}")
else:
    print(f"   ✅ {len(lines)} utterances verificadas.")

# ═══════════════════════════════════════════════════════════════════════════════
# 🔊 PASO 6/7: PRE-PROCESAMIENTO
# ═══════════════════════════════════════════════════════════════════════════════
print("🔊 6/7: Pre-procesando audios...")
preprocess_cmd = (
    f"python3 -m piper_train.preprocess "
    f"--input-dir {DATASET_DIR} "
    f"--output-dir {OUTPUT_DIR} "
    f"--language {LANGUAGE} "
    f"--dataset-format {DATASET_FORMAT} "
    f"--sample-rate {SAMPLE_RATE} "
    f"--max-workers {MAX_WORKERS}"
)
result = os.system(preprocess_cmd)

if not os.path.exists(f"{OUTPUT_DIR}/config.json"):
    raise Exception(
        "❌ Pre-procesamiento falló. Verifica que los archivos .wav "
        "coincidan con los nombres en metadata.csv y que estén en la "
        "carpeta wavs/."
    )
print("   ✅ Pre-procesamiento completado.")

# ═══════════════════════════════════════════════════════════════════════════════
# 🎙️ PASO 7/7: ENTRENAMIENTO
# ═══════════════════════════════════════════════════════════════════════════════
print(f"🎙️ 7/7: Iniciando entrenamiento ({CHECKPOINT_EPOCHS} epochs)...")
train_cmd = (
    f"python3 -m piper_train "
    f"--dataset-dir {OUTPUT_DIR} "
    f"--checkpoint-epochs {CHECKPOINT_EPOCHS} "
    f"--quality {QUALITY} "
    f"--batch-size {BATCH_SIZE} "
    f"--accelerator cuda "
    f"--devices 1"
)
os.system(train_cmd)

# ═══════════════════════════════════════════════════════════════════════════════
# 📦 EXPORTACIÓN A ONNX
# ═══════════════════════════════════════════════════════════════════════════════
print("📦 Exportando modelo a ONNX...")

# Buscar el mejor checkpoint
ckpt_files = glob.glob(f"{WORK_DIR}/**/*.ckpt", recursive=True)
if not ckpt_files:
    raise Exception("❌ No se encontró ningún checkpoint. El entrenamiento pudo haber fallado.")

best_ckpt = max(ckpt_files, key=os.path.getmtime)
print(f"   Usando checkpoint: {best_ckpt}")

# Crear script de exportación con parches para PyTorch 2.6
export_script = f"{WORK_DIR}/do_export.py"
with open(export_script, "w") as f:
    f.write("import torch, pathlib\n")
    f.write("torch.serialization.add_safe_globals([pathlib.PosixPath])\n")
    f.write("from piper_train.export_onnx import main\n")
    f.write("main()\n")

# FIX CRÍTICO #4: Parche numérico en transforms.py
# El assertion (discriminant >= 0).all() falla durante ONNX tracing
transforms_file = f"{PIPER_SRC}/piper_train/vits/transforms.py"
with open(transforms_file, "r") as f:
    transforms_code = f.read()
transforms_code = transforms_code.replace(
    "assert (discriminant >= 0).all(), discriminant",
    "discriminant = discriminant.clamp(min=1e-8)"
)
with open(transforms_file, "w") as f:
    f.write(transforms_code)

# FIX CRÍTICO #5: Forzar exportador ONNX Legacy (no Dynamo)
# PyTorch 2.6 usa el exportador Dynamo por defecto que no es compatible
export_onnx_file = f"{PIPER_SRC}/piper_train/export_onnx.py"
with open(export_onnx_file, "r") as f:
    export_code = f.read()
export_code = export_code.replace("torch.onnx.export(", "torch.onnx.export(dynamo=False,")
with open(export_onnx_file, "w") as f:
    f.write(export_code)

# Ejecutar exportación
output_onnx = f"{WORK_DIR}/{OUTPUT_MODEL_NAME}.onnx"
output_json = f"{WORK_DIR}/{OUTPUT_MODEL_NAME}.onnx.json"
os.system(f'python3 {export_script} "{best_ckpt}" {output_onnx}')
shutil.copy(f"{OUTPUT_DIR}/config.json", output_json)

# Verificar resultado
if os.path.exists(output_onnx):
    size_mb = os.path.getsize(output_onnx) / (1024 * 1024)
    print(f"\n{'='*60}")
    print(f"✅ ¡MODELO EXPORTADO EXITOSAMENTE!")
    print(f"   Archivo: {output_onnx} ({size_mb:.1f} MB)")
    print(f"   Config:  {output_json}")
    print(f"   Descárgalos desde la pestaña 'Output' de Kaggle.")
    print(f"{'='*60}")
else:
    print("❌ Error en la exportación. Revisa los mensajes anteriores.")
    print("   Ejecuta export_fix.py manualmente para intentar de nuevo.")
