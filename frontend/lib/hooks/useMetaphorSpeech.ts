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
    lang: string; // BCP-47, e.g. "en-IN"
    token?: string | null; // ephemeral token for cloud providers
}

export interface UseMetaphorSpeech {
    supported: boolean;
    micState: MicState;
    listening: boolean;
    interim: string; // current (not-yet-final) words
    finalText: string; // accumulated finalized words for this recording
    start: () => Promise<void>;
    stop: () => void;
    reset: () => void; // clear finalText + interim
    setFinalText: (v: string) => void; // for typing fallback
}

const browserHasWebSpeech = () =>
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function useMetaphorSpeech(opts: UseMetaphorSpeechOptions): UseMetaphorSpeech {
    const { provider, lang, token } = opts;
    const [micState, setMicState] = useState<MicState>("idle");
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [finalText, setFinalText] = useState("");
    const recRef = useRef<any>(null);

    const isWebSpeech = provider === "web_speech" || provider === "auto";
    const supported = isWebSpeech ? browserHasWebSpeech() : false;

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
        setListening(false);
        setMicState((s) => (s === "live" ? "ready" : s));
    }, []);

    const reset = useCallback(() => {
        setFinalText("");
        setInterim("");
    }, []);

    const startWebSpeech = useCallback(() => {
        const SR =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = lang;
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
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach((tr) => tr.stop());
            } catch {
                setMicState("denied");
                return;
            }
        }
        setListening(true);
        setMicState("live");
        startWebSpeech();
    }, [listening, isWebSpeech, startWebSpeech, stop]);

    // cleanup on unmount / lang change
    useEffect(() => () => stop(), [stop]);

    return {
        supported,
        micState,
        listening,
        interim,
        finalText,
        start,
        stop,
        reset,
        setFinalText,
    };
}
