# 🔧 Troubleshooting: Piper Voice Training en Kaggle

Guía de resolución de los problemas más comunes encontrados durante el entrenamiento de modelos de voz con Piper en Kaggle (y Colab).

---

## Error 1: `piper-phonemize` no se puede instalar

```
ERROR: No matching distribution found for piper-phonemize~=1.1.0
```

**Causa:** El repositorio `rhasspy/piper-phonemize` fue archivado en julio 2025. pip no puede encontrar el paquete.

**Solución:** Usar el puente Python incluido en `train_voice.py`. Este puente implementa las 8 funciones que Piper necesita usando `espeak-ng` directamente:

- `phonemize_espeak()`
- `phonemize_codepoints()`
- `phoneme_ids_espeak()`
- `phoneme_ids_codepoints()`
- `get_espeak_map()`
- `get_codepoints_map()`
- `get_max_phonemes()`
- `tashkeel_run()`

**Importante:** El puente debe instalarse en `site-packages`, NO solo en `sys.modules`, porque los comandos `python3 -m piper_train.*` crean subprocesos nuevos que no heredan `sys.modules`.

---

## Error 2: `ModuleNotFoundError: monotonic_align.core`

```
ModuleNotFoundError: No module named 'piper_train.vits.monotonic_align.monotonic_align.core'
```

**Causa:** El `setup.py build_ext --inplace` dentro de `monotonic_align/` genera el archivo `.so` en una ruta relativa incorrecta.

**Solución:** Compilar desde la **raíz** de `piper/src/python`:

```python
# ✅ CORRECTO: compilar desde la raíz
%cd /kaggle/working/piper/src/python
!python3 piper_train/vits/monotonic_align/setup.py build_ext --inplace

# ❌ INCORRECTO: compilar desde dentro de monotonic_align
%cd /kaggle/working/piper/src/python/piper_train/vits/monotonic_align
!python3 setup.py build_ext --inplace
```

Además, crear la subcarpeta que `__init__.py` espera:

```python
os.makedirs("piper_train/vits/monotonic_align/monotonic_align", exist_ok=True)
# Copiar el .so compilado como core.so
shutil.copy("piper_train/vits/monotonic_align/core.cpython-*.so",
            "piper_train/vits/monotonic_align/monotonic_align/core.so")
```

---

## Error 3: `ValueError: n must be at least one`

```
File "preprocess.py", line 491, in batched
    raise ValueError("n must be at least one")
```

**Causa:** Bug de compatibilidad con Python 3.12+ en la función `batched()`.

**Solución:** Agregar `--max-workers 1` al comando de preprocesamiento:

```bash
python3 -m piper_train.preprocess ... --max-workers 1
```

---

## Error 4: Audios no encontrados (`Missing .wav`)

```
WARNING:preprocess:Missing patricia_000.wav
AssertionError: No utterances found
```

**Causa:** El formato LJSpeech espera los archivos de audio en una carpeta llamada `wavs/` (no `clips/` ni otra).

**Solución:** Asegúrate de que la estructura sea:

```
dataset/
├── metadata.csv
└── wavs/
    ├── audio_001.wav
    ├── audio_002.wav
    └── ...
```

---

## Error 5: `_pickle.UnpicklingError` al exportar

```
_pickle.UnpicklingError: Weights only load failed.
WeightsUnpickler error: Unsupported global: GLOBAL pathlib.PosixPath
```

**Causa:** PyTorch 2.6 cambió el default de `torch.load()` a `weights_only=True`.

**Solución:** Agregar antes de cargar el checkpoint:

```python
import torch, pathlib
torch.serialization.add_safe_globals([pathlib.PosixPath])
```

---

## Error 6: `AssertionError: discriminant >= 0`

```
assert (discriminant >= 0).all(), discriminant
```

**Causa:** Inestabilidad numérica durante el tracing ONNX en `rational_quadratic_spline`.

**Solución:** Reemplazar el assert por un clamp en `transforms.py`:

```python
# Antes (falla):
assert (discriminant >= 0).all(), discriminant

# Después (funciona):
discriminant = discriminant.clamp(min=1e-8)
```

---

## Error 7: `ModuleNotFoundError: onnxscript`

```
ModuleNotFoundError: No module named 'onnxscript'
```

**Causa:** Dependencia faltante para el exportador ONNX de PyTorch.

**Solución:**

```bash
pip install onnxscript
```

---

## Error 8: `torch.export.export` falla con shapes dinámicos

```
The error above occurred when calling torch.export.export.
You can replace your 'export()' call with 'draft_export()'.
```

**Causa:** PyTorch 2.6 usa el exportador Dynamo por defecto, que no es compatible con VITS.

**Solución:** Forzar el exportador legacy modificando `export_onnx.py`:

```python
# Reemplazar:
torch.onnx.export(model, ...)

# Por:
torch.onnx.export(dynamo=False, model, ...)
```

---

## Error 9: Descarga de binarios falla

```
gzip: stdin: unexpected end of file
tar: Error is not recoverable
```

**Causa:** La descarga con `wget` puede fallar silenciosamente en Kaggle.

**Solución:** Usar `curl -L -f -o` en vez de `wget`, o simplemente usar el puente Python (recomendado).

---

## Notas sobre Plataformas

| Plataforma | Python | GPU | Tiempo Sesión | Estado |
|------------|--------|-----|---------------|--------|
| **Kaggle** | 3.12 | T4 x2 (30h/sem) | ~12h | ✅ Funciona con fixes |
| **Colab** | 3.11-3.13 | T4 (variable) | ~90 min | ⚠️ Inestable, cuota limitada |
| **Local** | 3.10+ | NVIDIA | Ilimitado | ✅ Si tienes GPU |
