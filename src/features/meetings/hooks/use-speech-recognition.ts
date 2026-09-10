"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API interface augmentation for TypeScript
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface IWindow extends Window {
  SpeechRecognition?: { new (): SpeechRecognitionInstance };
  webkitSpeechRecognition?: { new (): SpeechRecognitionInstance };
}

export function useSpeechRecognition() {
  const isSupported =
    typeof window !== "undefined"
      ? !!(
          (window as unknown as IWindow).SpeechRecognition ||
          (window as unknown as IWindow).webkitSpeechRecognition
        )
      : true;
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick
  useEffect(() => {
    if (isListening && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isListening, isPaused]);

  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onstart = () => {
      setErrorMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = "";
      let newFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const speechChunk = item[0]?.transcript || "";
        if (item.isFinal) {
          newFinal += speechChunk + " ";
        } else {
          currentInterim += speechChunk;
        }
      }

      if (newFinal) {
        setTranscript((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${newFinal.trim()}` : newFinal.trim();
        });
      }

      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        // Normal silence between sentences
        return;
      }
      if (event.error === "aborted") {
        return;
      }
      if (event.error === "not-allowed") {
        setErrorMessage("마이크 사용 권한이 거부되었습니다. 브라우저 주소창 좌측에서 마이크 권한을 허용해 주세요.");
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      setErrorMessage(`음성 인식 오류 (${event.error})`);
    };

    recognition.onend = () => {
      // Browser may stop recognition after silence; if still intended to be listening, restart it
      if (isListeningRef.current && !isPausedRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore already started
        }
      } else if (!isPausedRef.current) {
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript("");
      }
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (!recognitionRef.current) return;

    try {
      isListeningRef.current = true;
      isPausedRef.current = false;
      setIsListening(true);
      setIsPaused(false);
      recognitionRef.current.start();
    } catch {
      // recognition might already be active
    }
  }, [initRecognition]);

  const pauseListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isPausedRef.current = true;
    setIsPaused(true);
    setInterimTranscript("");
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (!recognitionRef.current) return;

    isPausedRef.current = false;
    setIsPaused(false);
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch {
      // ignore
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    isPausedRef.current = false;
    setIsListening(false);
    setIsPaused(false);
    setInterimTranscript("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    stopListening();
    setTranscript("");
    setInterimTranscript("");
    setDuration(0);
    setErrorMessage(null);
  }, [stopListening]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(remainMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(remainMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return {
    isSupported,
    isListening,
    isPaused,
    transcript,
    setTranscript,
    interimTranscript,
    errorMessage,
    duration,
    formattedDuration: formatDuration(duration),
    startListening,
    pauseListening,
    resumeListening,
    stopListening,
    resetTranscript,
  };
}
