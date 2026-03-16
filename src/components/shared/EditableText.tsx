/**
 * Inline-editable text block with optional voice-to-text.
 * Displays as plain text, click to edit, saves on blur or Enter.
 * Shows a subtle pencil icon and microphone icon on hover.
 * Voice input supports verbatim insertion or AI-refined integration.
 */

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Mic, MicOff, Sparkles } from 'lucide-react';
import { refineTextWithAI } from '../../services/aiService';
import styles from './EditableText.module.css';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

const hasVoiceSupport = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function EditableText({ value, onSave, multiline = false, placeholder, className }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showVoiceResult, setShowVoiceResult] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('setSelectionRange' in inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  async function handleSave(): Promise<void> {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      setDraft(value);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel(): void {
    setDraft(value);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      void handleSave();
    }
    if (e.key === 'Enter' && e.metaKey && multiline) {
      e.preventDefault();
      void handleSave();
    }
  }

  function toggleRecording(e: React.MouseEvent): void {
    e.stopPropagation();
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = createRecognition();
    if (!recognition) return;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript.trim());
        setShowVoiceResult(true);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript('');
  }

  function handleVoiceInsert(): void {
    if (isEditing) {
      setDraft((prev) => prev ? `${prev}\n${transcript}` : transcript);
    } else {
      setDraft(value ? `${value}\n${transcript}` : transcript);
      setIsEditing(true);
    }
    setShowVoiceResult(false);
    setTranscript('');
  }

  async function handleVoiceRefine(): Promise<void> {
    setIsRefining(true);
    try {
      const existingText = isEditing ? draft : value;
      const refined = await refineTextWithAI(existingText, transcript);
      setDraft(refined);
      if (!isEditing) setIsEditing(true);
    } catch {
      handleVoiceInsert();
      return;
    } finally {
      setIsRefining(false);
    }
    setShowVoiceResult(false);
    setTranscript('');
  }

  function dismissVoiceResult(e: React.MouseEvent): void {
    e.stopPropagation();
    setShowVoiceResult(false);
    setTranscript('');
  }

  const micButton = hasVoiceSupport && (
    <button
      className={`${styles.micBtn} ${isRecording ? styles.micBtnRecording : ''} ${isEditing ? styles.micBtnEdit : ''}`}
      onClick={toggleRecording}
      title={isRecording ? 'Stop recording' : 'Voice input'}
    >
      {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
    </button>
  );

  const recordingIndicator = isRecording && (
    <div className={styles.recordingIndicator}>
      <div className={styles.recordingDot} />
      <span className={styles.recordingText}>Recording...</span>
      {transcript && <span className={styles.recordingTranscript}>{transcript}</span>}
    </div>
  );

  const voiceResultOverlay = showVoiceResult && (
    <div className={styles.voiceOverlay}>
      <p className={styles.voiceTranscript}>&ldquo;{transcript}&rdquo;</p>
      <div className={styles.voiceActions}>
        <button className={styles.voiceInsertBtn} onClick={handleVoiceInsert}>
          <Check size={12} /> Insert
        </button>
        <button className={styles.voiceRefineBtn} onClick={() => void handleVoiceRefine()} disabled={isRefining}>
          <Sparkles size={12} /> {isRefining ? 'Refining...' : 'Refine with AI'}
        </button>
        <button className={styles.voiceDismissBtn} onClick={dismissVoiceResult}>
          <X size={12} />
        </button>
      </div>
    </div>
  );

  if (isEditing) {
    return (
      <div className={styles.editContainer}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={`${styles.textarea} ${className ?? ''}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={`${styles.input} ${className ?? ''}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
        )}
        {recordingIndicator}
        {voiceResultOverlay}
        <div className={styles.editActions}>
          <button className={styles.saveBtn} onClick={() => void handleSave()} disabled={saving}>
            <Check size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
            <X size={14} />
          </button>
          {micButton}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={styles.display}
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsEditing(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Edit: ${value || placeholder || 'empty'}`}
        title="Click to edit"
      >
        <span className={className}>{value || placeholder || 'Click to add text...'}</span>
        <Pencil size={12} className={styles.pencilIcon} />
        {micButton}
      </div>
      {recordingIndicator}
      {voiceResultOverlay}
    </>
  );
}

/** Create a SpeechRecognition instance configured for Australian English */
function createRecognition(): SpeechRecognition | null {
  const Ctor = (window as unknown as Record<string, unknown>)['SpeechRecognition'] as (new () => SpeechRecognition) | undefined
    ?? (window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] as (new () => SpeechRecognition) | undefined;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-AU';
  return recognition;
}
