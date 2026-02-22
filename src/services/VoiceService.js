/**
 * Aris Voice Service
 * Implementación robusta de TTS Offline utilizando Sherpa-ONNX y WebAssembly.
 */

class VoiceService {
    constructor() {
        this.module = null;
        this.ttsHandle = null;
        this.isInitialized = false;
        this.audioContext = null;
        this.modelPath = '/models/aris_voice/';
        this.wasmGluePath = '/sherpa-onnx-wasm-main-tts.js';
    }

    /**
     * Auxiliares de gestión de memoria (replicados de sherpa-onnx-tts.js)
     */
    initVitsModelConfig(config, Module) {
        const modelLen = Module.lengthBytesUTF8(config.model || '') + 1;
        const lexiconLen = Module.lengthBytesUTF8(config.lexicon || '') + 1;
        const tokensLen = Module.lengthBytesUTF8(config.tokens || '') + 1;
        const dataDirLen = Module.lengthBytesUTF8(config.dataDir || '') + 1;
        const dictDir = '';
        const dictDirLen = Module.lengthBytesUTF8(dictDir) + 1;
        const n = modelLen + lexiconLen + tokensLen + dataDirLen + dictDirLen;

        const buffer = Module._malloc(n);
        const len = 8 * 4;
        const ptr = Module._malloc(len);

        let offset = 0;
        Module.stringToUTF8(config.model || '', buffer + offset, modelLen);
        offset += modelLen;
        Module.stringToUTF8(config.lexicon || '', buffer + offset, lexiconLen);
        offset += lexiconLen;
        Module.stringToUTF8(config.tokens || '', buffer + offset, tokensLen);
        offset += tokensLen;
        Module.stringToUTF8(config.dataDir || '', buffer + offset, dataDirLen);
        offset += dataDirLen;
        Module.stringToUTF8(dictDir, buffer + offset, dictDirLen);

        offset = 0;
        Module.setValue(ptr, buffer + offset, 'i8*');
        offset += modelLen;
        Module.setValue(ptr + 4, buffer + offset, 'i8*');
        offset += lexiconLen;
        Module.setValue(ptr + 8, buffer + offset, 'i8*');
        offset += tokensLen;
        Module.setValue(ptr + 12, buffer + offset, 'i8*');
        offset += dataDirLen;
        Module.setValue(ptr + 16, config.noiseScale || 0.667, 'float');
        Module.setValue(ptr + 20, config.noiseScaleW || 0.8, 'float');
        Module.setValue(ptr + 24, config.lengthScale || 1.0, 'float');
        Module.setValue(ptr + 28, buffer + offset, 'i8*');

        return { buffer, ptr, len };
    }

    /**
     * Carga el script de pegamento de WASM dinámicamente.
     */
    async loadWasmScript() {
        return new Promise((resolve) => {
            if (window.Module && window.Module.calledRun) {
                this.module = window.Module;
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = this.wasmGluePath;
            script.onload = () => {
                const check = setInterval(() => {
                    if (window.Module && window.Module.calledRun) {
                        clearInterval(check);
                        this.module = window.Module;
                        resolve();
                    }
                }, 50);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Descarga un archivo y lo monta en el sistema de archivos de Emscripten.
     */
    async mountFile(url, filename) {
        const response = await fetch(url);
        const data = new Uint8Array(await response.arrayBuffer());
        this.module.FS.createDataFile('/', filename, data, true, true, true);
        console.log(`📦 Archivo montado en MEMFS: ${filename}`);
    }

    /**
     * Inicializa el motor TTS con el modelo de Aris.
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🎙️ Cargando motor Aris Voice WASM...');
            await this.loadWasmScript();

            // Montar archivos del modelo en MEMFS
            await this.mountFile(this.modelPath + 'aris_voice.onnx', 'aris_model.onnx');
            await this.mountFile(this.modelPath + 'tokens.txt', 'tokens.txt');

            const Module = this.module;

            // Configuración manual de punteros
            const vitsConfig = this.initVitsModelConfig({
                model: '/aris_model.onnx',
                tokens: '/tokens.txt',
                dataDir: '',
                noiseScale: 0.667,
                noiseScaleW: 0.8,
                lengthScale: 1.0
            }, Module);

            // Estructura SherpaOnnxOfflineTtsModelConfig
            const modelConfigPtr = Module._malloc(100); // Espacio suficiente
            Module._CopyHeap(vitsConfig.ptr, vitsConfig.len, modelConfigPtr);
            Module.setValue(modelConfigPtr + vitsConfig.len, 1, 'i32'); // numThreads
            Module.setValue(modelConfigPtr + vitsConfig.len + 4, 0, 'i32'); // debug

            // Estructura SherpaOnnxOfflineTtsConfig
            const ttsConfigPtr = Module._malloc(100);
            Module._CopyHeap(modelConfigPtr, 50, ttsConfigPtr);
            Module.setValue(ttsConfigPtr + 50, 0, 'i8*'); // ruleFsts
            Module.setValue(ttsConfigPtr + 54, 1, 'i32'); // maxNumSentences

            this.ttsHandle = Module._SherpaOnnxCreateOfflineTts(ttsConfigPtr);

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 22050
            });

            this.isInitialized = true;
            console.log('✅ Aris Voice (Patricia Clone) Inicializado.');
        } catch (error) {
            console.error('❌ Error en Aris Voice:', error);
        }
    }

    /**
     * Genera y reproduce el audio.
     */
    async speak(text) {
        if (!this.isInitialized) await this.initialize();
        if (!text || !this.ttsHandle) return;

        const Module = this.module;
        const textLen = Module.lengthBytesUTF8(text) + 1;
        const textPtr = Module._malloc(textLen);
        Module.stringToUTF8(text, textPtr, textLen);

        console.log(`🗣️ Sintetizando: "${text}"`);
        const audioHandle = Module._SherpaOnnxOfflineTtsGenerate(this.ttsHandle, textPtr, 0, 1.0);

        const samplesPtr = Module.HEAP32[audioHandle / 4];
        const numSamples = Module.HEAP32[audioHandle / 4 + 1];
        const sampleRate = Module.HEAP32[audioHandle / 4 + 2];

        const samples = new Float32Array(numSamples);
        const heapSamples = new Float32Array(Module.HEAPF32.buffer, samplesPtr, numSamples);
        samples.set(heapSamples);

        Module._SherpaOnnxDestroyOfflineTtsGeneratedAudio(audioHandle);
        Module._free(textPtr);

        // Reproducción
        const buffer = this.audioContext.createBuffer(1, samples.length, sampleRate);
        buffer.getChannelData(0).set(samples);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        source.start();

        return new Promise(r => source.onended = r);
    }

    /**
     * Detiene el audio.
     */
    stop() {
        if (this.audioContext) this.audioContext.suspend();
    }
}

export default new VoiceService();
