"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/* -------------------------------------------------------------------------- */
/*  Capability detection                                                      */
/* -------------------------------------------------------------------------- */

export type SpeechSupport = {
  recognition: boolean;
  synthesis: boolean;
  /** False while rendering on the server / during hydration. */
  checked: boolean;
};

const SERVER_SUPPORT: SpeechSupport = {
  recognition: false,
  synthesis: false,
  checked: false,
};

let clientSupport: SpeechSupport | null = null;

/** Snapshots must be referentially stable, so the result is computed once. */
function getClientSupport(): SpeechSupport {
  clientSupport ??= {
    recognition: Boolean(
      window.SpeechRecognition ?? window.webkitSpeechRecognition,
    ),
    synthesis: typeof window.speechSynthesis !== "undefined",
    checked: true,
  };
  return clientSupport;
}

const neverChanges = () => () => {};

export function useSpeechSupport(): SpeechSupport {
  return useSyncExternalStore(
    neverChanges,
    getClientSupport,
    () => SERVER_SUPPORT,
  );
}

/* -------------------------------------------------------------------------- */
/*  Text to speech - the tutor's voice                                        */
/* -------------------------------------------------------------------------- */

export type VoiceOption = { uri: string; name: string; lang: string };

export function useTutorVoice() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Chrome populates the voice list asynchronously, hence the event.
    const load = () => {
      const list = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith("en"))
        .map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang }));
      if (list.length === 0) return;

      setVoices(list);
      setVoiceURI((prev) => {
        if (prev && list.some((v) => v.uri === prev)) return prev;
        const stored = localStorage.getItem("tutor.voiceURI");
        if (stored && list.some((v) => v.uri === stored)) return stored;
        const preferred =
          list.find((v) =>
            /female|zira|samantha|sonia|aria|jenny/i.test(v.name),
          ) ??
          list.find((v) => v.lang === "en-US") ??
          list[0];
        return preferred.uri;
      });
    };

    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    if (voiceURI) localStorage.setItem("tutor.voiceURI", voiceURI);
  }, [voiceURI]);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis || !text) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => v.voiceURI === voiceURI);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? "en-US";
        utterance.rate = rate;
        utterance.pitch = 1;

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          setSpeaking(false);
          resolve();
        };

        utterance.onend = finish;
        utterance.onerror = finish;

        setSpeaking(true);
        window.speechSynthesis.speak(utterance);

        // Chrome sometimes drops long utterances silently; this guard makes
        // sure a call never gets stuck waiting for an "end" that never comes.
        setTimeout(finish, 3000 + text.length * 90);
      }),
    [voiceURI, rate],
  );

  useEffect(() => cancel, [cancel]);

  return {
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    speaking,
    speak,
    cancel,
  };
}

/* -------------------------------------------------------------------------- */
/*  Speech to text - the learner's microphone                                 */
/* -------------------------------------------------------------------------- */

const NO_RECOGNITION_MESSAGE =
  "Your browser cannot listen to the microphone. Please use Google Chrome or Microsoft Edge.";

type ListeningOptions = {
  /** When false the microphone is released. */
  enabled: boolean;
  /** Fired once the learner has been silent for `pauseMs`. */
  onUtterance: (text: string) => void;
  /** How long a silence ends the learner's turn. */
  pauseMs?: number;
  lang?: string;
};

export function useListening({
  enabled,
  onUtterance,
  pauseMs = 1400,
  lang = "en-US",
}: ListeningOptions) {
  const support = useSpeechSupport();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  const onUtteranceRef = useRef(onUtterance);

  // Keep the latest values reachable from the recognition callbacks without
  // making the effect below depend on them (which would restart the mic).
  useEffect(() => {
    enabledRef.current = enabled;
    onUtteranceRef.current = onUtterance;
  });

  const flush = useCallback(() => {
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    setInterim("");
    if (text.length > 1) onUtteranceRef.current(text);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setRuntimeError(null);
    };

    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          bufferRef.current = `${bufferRef.current} ${text}`.trim();
        } else {
          pending += text;
        }
      }
      setInterim(pending);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, pauseMs);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setRuntimeError(
          "Microphone permission was blocked. Allow the microphone in your browser and reload the page.",
        );
        return;
      }
      if (event.error === "network") {
        setRuntimeError("Speech recognition needs an internet connection.");
        return;
      }
      setRuntimeError(`Microphone error: ${event.error}`);
    };

    // Chrome stops recognition on its own every ~60s and after long silences.
    recognition.onend = () => {
      setListening(false);
      if (!enabledRef.current) return;
      try {
        recognition.start();
      } catch {
        /* already starting - ignore */
      }
    };

    try {
      recognition.start();
    } catch {
      /* already started - ignore */
    }

    return () => {
      enabledRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onstart = null;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      bufferRef.current = "";
      setInterim("");
      setListening(false);
    };
  }, [enabled, lang, pauseMs, flush]);

  /** Send whatever has been said so far immediately. */
  const sendNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flush();
  }, [flush]);

  const error =
    support.checked && !support.recognition
      ? NO_RECOGNITION_MESSAGE
      : runtimeError;

  return { listening, interim, error, sendNow };
}

/* -------------------------------------------------------------------------- */
/*  Microphone level meter - drives the animated call ring                    */
/* -------------------------------------------------------------------------- */

export function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.mediaDevices) {
      return;
    }

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        context = new AudioContext();
        const source = context.createMediaStreamSource(s);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          frame = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        /* no microphone - the ring simply stays still */
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      void context?.close();
      setLevel(0);
    };
  }, [active]);

  return level;
}
