# 🎙️ Piper Voice Training Toolkit (Kaggle)

> **Entrenamiento de modelos de voz TTS personalizados usando [Piper](https://github.com/rhasspy/piper) en Kaggle.**
> Exporta a formato `.onnx` para uso offline con Sherpa-ONNX, PWA y APK.

## 🏆 Caso de Éxito

Este toolkit fue desarrollado durante la creación de **Aris Voice** — un modelo de voz personalizado para la aplicación ARIS (LogTech). El proceso de entrenamiento se completó exitosamente en Kaggle con:

- **500 epochs** de entrenamiento
- **4 archivos de audio** (~30 seg cada uno)
- **~20 minutos** de entrenamiento en GPU T4
- **Modelo final:** `aris_voice.onnx` (60.8 MB)

---

## 📋 Requisitos Previos

### En Kaggle:
1. Cuenta verificada con teléfono (para acceso a GPU/Internet)
2. **GPU T4 x2** activada (Accelerator)
3. **Internet ON** (para descargar dependencias)
4. **Persistence:** No persistence
5. **Environment:** Pin to original environment

### Dataset de Audio:
- Archivos `.wav` (mono, 22050 Hz recomendado)
- Mínimo 4 archivos de audio
- Archivo `metadata.csv` en formato LJSpeech: `nombre_archivo.wav|transcripción del texto`
- Subir como dataset en Kaggle ("Add Data")

---

## 🚀 Uso Rápido

1. Sube tu dataset a Kaggle como un nuevo Dataset
2. Crea un nuevo Notebook en Kaggle
3. Activa GPU T4 x2 + Internet ON
4. Copia el contenido de `train_voice.py` en una celda
5. **Modifica** la sección de metadata con tus transcripciones
6. Ejecuta la celda
7. Espera ~20-30 minutos
8. Descarga `aris_voice.onnx` y `aris_voice.onnx.json` desde Output

---

## 📁 Estructura del Proyecto

```
tools/voice-training/
├── README.md                  # Esta documentación
├── train_voice.py             # Script principal (todo en uno)
├── export_fix.py              # Script de exportación con parches
└── TROUBLESHOOTING.md         # Guía de resolución de problemas
```

---

## 🔧 Fixes Críticos Incluidos

Este toolkit incluye soluciones para problemas conocidos de compatibilidad:

| # | Problema | Causa | Solución |
|---|----------|-------|----------|
| 1 | `piper-phonemize` no se instala | Repositorio archivado (Jul 2025) | Puente Python con las 8 funciones requeridas |
| 2 | `monotonic_align` no compila | `setup.py build_ext` ejecutado desde carpeta incorrecta | Compilar desde `piper/src/python` (raíz) |
| 3 | `ModuleNotFoundError: piper_phonemize` en subprocesos | `sys.modules` solo vive en el notebook | Instalar en `site-packages` |
| 4 | `ValueError: n must be at least one` | Bug de Python 3.12 con workers | `--max-workers 1` |
| 5 | `_pickle.UnpicklingError` al exportar | PyTorch 2.6 cambia `weights_only` default | `torch.serialization.add_safe_globals([pathlib.PosixPath])` |
| 6 | `AssertionError: discriminant >= 0` al exportar | Inestabilidad numérica en ONNX export | Reemplazar `assert` por `clamp(min=1e-8)` |
| 7 | `ModuleNotFoundError: onnxscript` | Dependencia faltante para ONNX export | `pip install onnxscript` |
| 8 | `torch.export.export` falla con shapes | PyTorch 2.6 usa Dynamo por defecto | `torch.onnx.export(dynamo=False, ...)` |
| 9 | Audios no encontrados en preprocess | LJSpeech espera carpeta `wavs/` no `clips/` | Copiar a `dataset/wavs/` |

---

## 🎯 Integración Post-Entrenamiento

Una vez exportado el modelo, puedes integrarlo en tu aplicación:

### PWA (Web)
```javascript
// Usar Sherpa-ONNX WebAssembly
import { createOfflineTts } from 'sherpa-onnx-wasm';
const tts = await createOfflineTts({
  model: '/models/aris_voice.onnx',
  config: '/models/aris_voice.onnx.json'
});
```

### APK (Android)
```kotlin
// Usar Sherpa-ONNX Android SDK
val tts = OfflineTts(
  modelPath = "models/aris_voice.onnx",
  configPath = "models/aris_voice.onnx.json"
)
```

---

## 📄 Licencia

Este toolkit es de código abierto. Piper está bajo licencia MIT.

---

## 🙏 Créditos

- [Piper TTS](https://github.com/rhasspy/piper) por rhasspy
- [Kaggle](https://www.kaggle.com) por el entorno de entrenamiento gratuito
- Desarrollado como parte del proyecto **ARIS** (LogTech)
