"use client";

// ============================================================
// Level 3 "Metaphor" — pluggable speech-to-text hook (connector).
// Headless: returns recognition state + controls; the exam page UI
// (designed separately) binds to it. Provider is admin-configurable.
//
//   web_speech  -> fully implemented (browser SpeechRecognition)
//   elevenlabs / azure / google / deepgram -> adapter seam (TODO):
//       these need an ephemeral token + websocket streaming; until
//       wired they report `unsupported` so the UI can fall back.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";

export type MicState = "idle" | "ready" | "live" | "denied" | "unsupported";

export interface UseMetaphorSpeechOptions {
    provider: string; // from /metaphor/stt-config
    lang: string; // BCP-47, e.g. "en-IN"; "auto" leaves browser recognition language unset
    token?: string | null; // ephemeral token for cloud providers
}

export interface UseMetaphorSpeech {
    supported: boolean;
    micState: MicState;
    listening: boolean;
    audioLevel: number;
    spectrum: number[];
    waveform: number[];
    interim: string; // current (not-yet-final) words
    finalText: string; // accumulated finalized words for this recording
    start: () => Promise<void>;
    stop: () => void;
    finalizeRecording: () => Promise<Blob | null>;
    resetRecording: () => void;
    reset: () => void; // clear finalText + interim
    setFinalText: (v: string) => void; // for typing fallback
    isRecordingSupported: boolean;
}

const browserHasWebSpeech = () =>
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

const EMPTY_SPECTRUM = Array(32).fill(0.04);
const EMPTY_WAVEFORM = Array(72).fill(0);

const getRecorderOptions = (): MediaRecorderOptions | undefined => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return undefined;
    const mimeType = "audio/webm;codecs=opus";
    return MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined;
};

export function useMetaphorSpeech(opts: UseMetaphorSpeechOptions): UseMetaphorSpeech {
    const { provider, lang, token: _token } = opts;
    const [micState, setMicState] = useState<MicState>("idle");
    const [listening, setListening] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [spectrum, setSpectrum] = useState<number[]>(EMPTY_SPECTRUM);
    const [waveform, setWaveform] = useState<number[]>(EMPTY_WAVEFORM);
    const [interim, setInterim] = useState("");
    const [finalText, setFinalText] = useState("");
    const recRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const analyserRafRef = useRef<number | null>(null);
    const smoothLevelRef = useRef(0);
    const smoothSpectrumRef = useRef<number[]>(EMPTY_SPECTRUM);
    const smoothWaveformRef = useRef<number[]>(EMPTY_WAVEFORM);

    const isWebSpeech = provider === "web_speech" || provider === "auto";
    const supported = isWebSpeech ? browserHasWebSpeech() : false;
    const isRecordingSupported =
        typeof window !== "undefined" && typeof MediaRecorder !== "undefined";

    const stopAnalyser = useCallback((stopStream = true) => {
        if (analyserRafRef.current !== null) {
            cancelAnimationFrame(analyserRafRef.current);
            analyserRafRef.current = null;
        }
        if (audioCtxRef.current) {
            void audioCtxRef.current.close().catch(() => undefined);
            audioCtxRef.current = null;
        }
        if (stopStream && streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        smoothLevelRef.current = 0;
        smoothSpectrumRef.current = EMPTY_SPECTRUM;
        smoothWaveformRef.current = EMPTY_WAVEFORM;
        setAudioLevel(0);
        setSpectrum(EMPTY_SPECTRUM);
        setWaveform(EMPTY_WAVEFORM);
    }, []);

    const startAnalyser = useCallback((stream: MediaStream) => {
        stopAnalyser(false);
        streamRef.current = stream;
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) return;

        const ctx = new AudioContextCtor() as AudioContext;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.88;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioCtxRef.current = ctx;

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);
        const barCount = 32;
        const wavePointCount = EMPTY_WAVEFORM.length;
        // The analyser eases the data every animation frame (~60fps) into refs,
        // but pushing that into React state 60x/sec re-renders the whole exam
        // and makes the wave stutter. Publish to React at ~15fps instead and let
        // the CSS transition on the bars interpolate smoothly between updates.
        let frame = 0;
        const PUBLISH_EVERY = 4;
        const draw = () => {
            analyser.getByteFrequencyData(freqData);
            analyser.getByteTimeDomainData(timeData);
            const usable = freqData.slice(2, Math.min(freqData.length, 220));
            const target = Array.from({ length: barCount }, (_, i) => {
                const start = Math.floor(Math.pow(i / barCount, 1.55) * usable.length);
                const end = Math.max(start + 1, Math.floor(Math.pow((i + 1) / barCount, 1.55) * usable.length));
                let peak = 0;
                for (let j = start; j < Math.min(end, usable.length); j += 1) peak = Math.max(peak, usable[j]);
                const normalized = peak / 255;
                const gated = normalized < 0.12 ? 0 : (normalized - 0.12) / 0.88;
                return Math.min(0.86, 0.04 + Math.pow(gated, 0.9) * 0.96);
            });
            const sliceSize = Math.max(1, Math.floor(timeData.length / wavePointCount));
            const rawWave = Array.from({ length: wavePointCount }, (_, i) => {
                const start = i * sliceSize;
                let sum = 0;
                for (let j = 0; j < sliceSize && start + j < timeData.length; j += 1) {
                    sum += (timeData[start + j] - 128) / 128;
                }
                return sum / sliceSize;
            });
            const rms = Math.sqrt(rawWave.reduce((sum, value) => sum + value * value, 0) / rawWave.length);
            const peakWave = rawWave.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0);
            const autoGain = Math.min(3.1, 0.62 / Math.max(peakWave, 0.2));
            const targetWave = rawWave.map((value) => Math.max(-1, Math.min(1, value * autoGain)));
            const avg = usable.reduce((sum, n) => sum + n, 0) / Math.max(1, usable.length);
            const gatedRms = rms < 0.025 ? 0 : rms - 0.025;
            const gatedAvg = avg / 255 < 0.08 ? 0 : avg / 255 - 0.08;
            const targetLevel = Math.min(0.82, Math.max(gatedRms * 3.2, gatedAvg * 1.45));
            const prevSpectrum = smoothSpectrumRef.current;
            const smoothedSpectrum = target.map((value, i) => {
                const prev = prevSpectrum[i] ?? 0.04;
                const easing = value > prev ? 0.2 : 0.1;
                return prev + (value - prev) * easing;
            });
            const prevWave = smoothWaveformRef.current;
            const smoothedWave = targetWave.map((value, i) => {
                const prev = prevWave[i] ?? 0;
                return prev + (value - prev) * 0.26;
            });
            const levelEasing = targetLevel > smoothLevelRef.current ? 0.28 : 0.16;
            const smoothedLevel = smoothLevelRef.current + (targetLevel - smoothLevelRef.current) * levelEasing;
            smoothSpectrumRef.current = smoothedSpectrum;
            smoothWaveformRef.current = smoothedWave;
            smoothLevelRef.current = smoothedLevel;
            if (frame % PUBLISH_EVERY === 0) {
                setAudioLevel(smoothedLevel);
                setSpectrum(smoothedSpectrum);
                setWaveform(smoothedWave);
            }
            frame += 1;
            analyserRafRef.current = requestAnimationFrame(draw);
        };
        draw();
    }, [stopAnalyser]);

    const ensureMediaRecorder = useCallback((stream: MediaStream) => {
        if (!isRecordingSupported) return;
        const existing = mediaRecorderRef.current;
        if (existing && existing.state === "paused") {
            existing.resume();
            return;
        }
        if (existing && existing.state === "recording") return;

        try {
            const recorder = new MediaRecorder(stream, getRecorderOptions());
            recorder.ondataavailable = (event) => {
                if (event.data?.size) audioChunksRef.current.push(event.data);
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
        } catch {
            mediaRecorderRef.current = null;
        }
    }, [isRecordingSupported]);

    const stop = useCallback(() => {
        if (recRef.current) {
            try {
                recRef.current.onend = null;
                recRef.current.stop();
            } catch {
                /* noop */
            }
            recRef.current = null;
        }
        const recorder = mediaRecorderRef.current;
        if (recorder?.state === "recording") {
            try {
                recorder.pause();
            } catch {
                /* noop */
            }
        }
        stopAnalyser(!(recorder && recorder.state !== "inactive"));
        setListening(false);
        setMicState((s) => (s === "live" ? "ready" : s));
    }, [stopAnalyser]);

    const resetRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            try {
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorder.stop();
            } catch {
                /* noop */
            }
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        stopAnalyser(true);
    }, [stopAnalyser]);

    const finalizeRecording = useCallback(async (): Promise<Blob | null> => {
        if (listening) stop();
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
            stopAnalyser(true);
            return null;
        }

        if (recorder.state === "inactive") {
            const blob = audioChunksRef.current.length
                ? new Blob(audioChunksRef.current, { type: "audio/webm" })
                : null;
            mediaRecorderRef.current = null;
            audioChunksRef.current = [];
            stopAnalyser(true);
            return blob && blob.size > 0 ? blob : null;
        }

        return new Promise<Blob | null>((resolve) => {
            recorder.onstop = () => {
                const type = recorder.mimeType || "audio/webm";
                const blob = audioChunksRef.current.length
                    ? new Blob(audioChunksRef.current, { type })
                    : null;
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                stopAnalyser(true);
                resolve(blob && blob.size > 0 ? blob : null);
            };
            try {
                recorder.requestData();
                recorder.stop();
            } catch {
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                stopAnalyser(true);
                resolve(null);
            }
        });
    }, [listening, stop, stopAnalyser]);

    const reset = useCallback(() => {
        setFinalText("");
        setInterim("");
    }, []);

    const startWebSpeech = useCallback(() => {
        const SR =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SR();
        if (lang !== "auto") rec.lang = lang;
        rec.interimResults = true;
        rec.continuous = true;
        rec.onresult = (e: any) => {
            let fin = "";
            let itm = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const r = e.results[i];
                if (r.isFinal) fin += r[0].transcript;
                else itm += r[0].transcript;
            }
            if (fin) setFinalText((prev) => (prev ? prev + " " : "") + fin.trim());
            setInterim(itm);
        };
        rec.onerror = (e: any) => {
            if (e.error === "not-allowed" || e.error === "service-not-allowed") {
                setMicState("denied");
                stop();
            } else if (e.error === "no-speech") {
                /* keep going */
            } else {
                stop();
            }
        };
        rec.onend = () => {
            setInterim("");
            stopAnalyser(false);
            setListening(false);
            setMicState((s) => (s === "live" ? "ready" : s));
        };
        recRef.current = rec;
        try {
            rec.start();
        } catch {
            /* already started */
        }
    }, [lang, stop]);

    const start = useCallback(async () => {
        if (listening) {
            stop();
            return;
        }
        // Cloud providers not wired yet -> report unsupported so the UI falls back.
        if (!isWebSpeech) {
            setMicState("unsupported");
            // TODO(provider): open a streaming session with `token` for
            // elevenlabs/azure/google/deepgram and push interim/final results.
            return;
        }
        if (!browserHasWebSpeech()) {
            setMicState("unsupported");
            return;
        }
        // best-effort mic permission
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream = streamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
                startAnalyser(stream);
                ensureMediaRecorder(stream);
            } catch {
                setMicState("denied");
                return;
            }
        }
        setListening(true);
        setMicState("live");
        startWebSpeech();
    }, [listening, isWebSpeech, startWebSpeech, startAnalyser, ensureMediaRecorder, stop]);

    // cleanup on unmount / lang change
    useEffect(() => () => {
        stop();
        resetRecording();
    }, [stop, resetRecording]);

    return {
        supported,
        micState,
        listening,
        audioLevel,
        spectrum,
        waveform,
        interim,
        finalText,
        start,
        stop,
        finalizeRecording,
        resetRecording,
        reset,
        setFinalText,
        isRecordingSupported,
    };
}
