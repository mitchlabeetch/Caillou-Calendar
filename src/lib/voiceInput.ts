/**
 * Web Speech API wrapper.
 *
 * Wraps SpeechRecognition with a Promise-based interface. Returns the
 * final transcript (or null if recognition is unavailable / denied).
 *
 * Browser support is non-uniform — Safari prefixes the type, Firefox
 * doesn't ship it. The caller should always have a text fallback.
 */

export interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

type SR = {
  new (): SpeechRecognitionLike;
};

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
}

declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

export interface VoiceSession {
  stop(): void;
  final: Promise<string>;
  onResult(cb: (text: string, isFinal: boolean) => void): void;
  onEnd(cb: () => void): void;
}

export function startVoice(lang = navigator.language ?? 'en-US'): VoiceSession | null {
  if (!isVoiceSupported()) return null;
  const Ctor = (window.SpeechRecognition ?? window.webkitSpeechRecognition) as SR;
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let resolveFinal!: (text: string) => void;
  const final = new Promise<string>(res => { resolveFinal = res; });

  let resultCb: ((text: string, isFinal: boolean) => void) | null = null;
  let endCb: (() => void) | null = null;

  recognition.onresult = (e: SpeechRecognitionEventLike) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const text = r[0].transcript.trim();
      if (resultCb) resultCb(text, r.isFinal);
      if (r.isFinal) resolveFinal(text);
    }
  };
  recognition.onend = () => {
    resolveFinal('');
    if (endCb) endCb();
  };
  recognition.onerror = () => {
    resolveFinal('');
    if (endCb) endCb();
  };

  try {
    recognition.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      try { recognition.stop(); } catch { /* ignore */ }
    },
    final,
    onResult(cb) { resultCb = cb; },
    onEnd(cb) { endCb = cb; },
  };
}