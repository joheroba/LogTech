# =============================================================================
# 🔧 SCRIPT DE EXPORTACIÓN CON PARCHES (Uso Independiente)
# =============================================================================
# Usa este script si la exportación falló durante el entrenamiento
# o si necesitas re-exportar un checkpoint existente.
#
# USO EN KAGGLE:
#   Celda 1: !pip install -q onnxscript
#   Celda 2: Pega este código y modifica CHECKPOINT_PATH
# =============================================================================

import os, glob, shutil

# CONFIGURACIÓN
CHECKPOINT_PATH = None  # None = auto-detectar el más reciente
OUTPUT_NAME = "aris_voice"
WORK_DIR = "/kaggle/working"
PIPER_SRC = f"{WORK_DIR}/piper/src/python"
OUTPUT_DIR = f"{WORK_DIR}/output"

# Auto-detectar checkpoint si no se especificó
if CHECKPOINT_PATH is None:
    ckpt_files = glob.glob(f"{WORK_DIR}/**/*.ckpt", recursive=True)
    if not ckpt_files:
        raise Exception("❌ No se encontró ningún checkpoint.")
    CHECKPOINT_PATH = max(ckpt_files, key=os.path.getmtime)

print(f"📦 Checkpoint: {CHECKPOINT_PATH}")

# ═══════════════════════════════════════════════════════════════════════════════
# PARCHE 1: PyTorch 2.6 - weights_only=True por defecto
# ═══════════════════════════════════════════════════════════════════════════════
# PyTorch 2.6 cambió el default de torch.load a weights_only=True,
# pero los checkpoints de Piper contienen pathlib.PosixPath que no está
# en la lista de globals permitidos.
import torch, pathlib
torch.serialization.add_safe_globals([pathlib.PosixPath])

# ═══════════════════════════════════════════════════════════════════════════════
# PARCHE 2: Aserción numérica en transforms.py
# ═══════════════════════════════════════════════════════════════════════════════
# Durante el tracing ONNX, rational_quadratic_spline puede generar
# valores negativos en el discriminante. Reemplazamos el assert por clamp.
transforms_file = f"{PIPER_SRC}/piper_train/vits/transforms.py"
if os.path.exists(transforms_file):
    with open(transforms_file, "r") as f:
        code = f.read()
    if "assert (discriminant >= 0).all()" in code:
        code = code.replace(
            "assert (discriminant >= 0).all(), discriminant",
            "discriminant = discriminant.clamp(min=1e-8)"
        )
        with open(transforms_file, "w") as f:
            f.write(code)
        print("✅ Parche transforms.py aplicado")

# ═══════════════════════════════════════════════════════════════════════════════
# PARCHE 3: Forzar exportador Legacy (no Dynamo)
# ═══════════════════════════════════════════════════════════════════════════════
# PyTorch 2.6 usa torch.export (Dynamo) por defecto en torch.onnx.export.
# El modelo VITS de Piper no es compatible con Dynamo. Forzamos legacy.
export_file = f"{PIPER_SRC}/piper_train/export_onnx.py"
if os.path.exists(export_file):
    with open(export_file, "r") as f:
        code = f.read()
    if "dynamo=False" not in code:
        code = code.replace("torch.onnx.export(", "torch.onnx.export(dynamo=False,")
        with open(export_file, "w") as f:
            f.write(code)
        print("✅ Parche Legacy ONNX aplicado")

# ═══════════════════════════════════════════════════════════════════════════════
# EJECUTAR EXPORTACIÓN
# ═══════════════════════════════════════════════════════════════════════════════
export_script = f"{WORK_DIR}/do_export.py"
with open(export_script, "w") as f:
    f.write("import torch, pathlib\n")
    f.write("torch.serialization.add_safe_globals([pathlib.PosixPath])\n")
    f.write("from piper_train.export_onnx import main\n")
    f.write("main()\n")

output_onnx = f"{WORK_DIR}/{OUTPUT_NAME}.onnx"
output_json = f"{WORK_DIR}/{OUTPUT_NAME}.onnx.json"

os.system(f'python3 {export_script} "{CHECKPOINT_PATH}" {output_onnx}')

# Copiar config.json
config_files = glob.glob(f"{OUTPUT_DIR}/**/config.json", recursive=True)
if config_files:
    shutil.copy(config_files[0], output_json)

# Verificar
if os.path.exists(output_onnx):
    size_mb = os.path.getsize(output_onnx) / (1024 * 1024)
    print(f"\n{'='*60}")
    print(f"✅ ¡EXPORTACIÓN EXITOSA!")
    print(f"   Modelo: {output_onnx} ({size_mb:.1f} MB)")
    print(f"   Config: {output_json}")
    print(f"{'='*60}")
else:
    print("❌ La exportación falló. Revisa los errores arriba.")
