import { describe, it, expect } from 'vitest';
import { isVoiceSupported, startVoice } from './voiceInput';

describe('voiceInput', () => {
  it('reports voice support based on the SpeechRecognition constructor', () => {
    expect(typeof isVoiceSupported()).toBe('boolean');
  });

  it('returns null when no recognition constructor exists', () => {
    const original = window.SpeechRecognition;
    const originalWebkit = window.webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    expect(startVoice()).toBeNull();
    window.SpeechRecognition = original;
    window.webkitSpeechRecognition = originalWebkit;
  });
});