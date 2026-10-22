let currentAudio: HTMLAudioElement | null = null;

export async function playTextToSpeech(
  text: string,
  voice: string = 'Kore',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): Promise<() => void> {
  // Stop existing playback
  stopAudioPlayback();

  // Try server-side Gemini 3.8 Flash Lite TTS first
  try {
    onStart?.();
    const res = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        currentAudio = new Audio(audioUrl);
        currentAudio.onended = () => {
          currentAudio = null;
          onEnd?.();
        };
        currentAudio.onerror = () => {
          fallbackBrowserSpeech(text, onEnd, onError);
        };
        await currentAudio.play();
        return stopAudioPlayback;
      }
    }
  } catch (e) {
    console.warn('Server TTS failed, falling back to browser speech synthesis:', e);
  }

  // Fallback to browser SpeechSynthesis
  return fallbackBrowserSpeech(text, onEnd, onError);
}

function fallbackBrowserSpeech(
  text: string,
  onEnd?: () => void,
  onError?: (err: string) => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Speech synthesis is not supported in this browser.');
    onEnd?.();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();
    // Strip markdown symbols for clearer browser speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~\[\]]/g, ' ')
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      onError?.(e.error || 'Speech synthesis error');
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  } catch (err: any) {
    onError?.(err?.message || 'Speech failed');
    onEnd?.();
    return () => {};
  }
}

export function stopAudioPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
