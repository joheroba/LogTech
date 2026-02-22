/**
 * React Hook for using Aris Voice TTS.
 */

import { useState, useCallback, useEffect } from 'react';
import VoiceService from '../services/VoiceService';

export const useArisVoice = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Inicializar el servicio al montar el hook
        const init = async () => {
            await VoiceService.initialize();
            setIsReady(true);
        };
        init();

        return () => {
            VoiceService.stop();
        };
    }, []);

    /**
     * Speaks a given text.
     */
    const speak = useCallback(async (text) => {
        if (!text) return;

        setIsSpeaking(true);
        try {
            await VoiceService.speak(text);
        } catch (error) {
            console.error('Error in useArisVoice:', error);
        } finally {
            setIsSpeaking(false);
        }
    }, []);

    /**
     * Stops current speech.
     */
    const stop = useCallback(() => {
        VoiceService.stop();
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isReady
    };
};
