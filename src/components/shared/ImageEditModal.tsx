/**
 * Modal for AI-powered image editing via Gemini.
 * Shows the original photo, a text input for the edit prompt,
 * and displays the result with an "AI Generated" badge.
 */

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { editImageWithAI } from '../../services/aiService';
import styles from './ImageEditModal.module.css';

interface ImageEditModalProps {
  /** Controls visibility */
  visible: boolean;
  /** URL of the photo to edit */
  photoUrl: string;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Called with the edited image data URL when saved */
  onSave: (editedImageUrl: string) => void;
}

const PROMPT_SUGGESTIONS = [
  'Remove the fence and show the view behind',
  'Show with new terracotta roof tiles',
  'Remove graffiti from the wall',
  'Show with a fresh coat of white paint',
  'Remove the overgrown vegetation',
] as const;

export function ImageEditModal({
  visible,
  photoUrl,
  onClose,
  onSave,
}: ImageEditModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setPrompt('');
      setEditedImageUrl(null);
      setError(null);
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const result = await editImageWithAI(photoUrl, prompt.trim());
      setEditedImageUrl(result.editedImageUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image editing failed');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSave() {
    if (editedImageUrl) {
      onSave(editedImageUrl);
      onClose();
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="AI Image Edit"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Sparkles size={18} className={styles.titleIcon} />
            <h3 className={styles.title}>AI Image Edit</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Image preview */}
        <div className={styles.imageContainer}>
          <img
            src={editedImageUrl ?? photoUrl}
            alt="Preview"
            className={styles.previewImage}
          />
          {editedImageUrl && (
            <span className={styles.aiBadge}>AI Generated</span>
          )}
        </div>

        {/* Prompt input */}
        <label className={styles.inputLabel} htmlFor="ai-edit-prompt">
          Describe your edit
        </label>
        <textarea
          ref={inputRef}
          id="ai-edit-prompt"
          className={styles.promptInput}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Remove the fence and show the view behind"
          rows={3}
          disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !editedImageUrl) {
              e.preventDefault();
              void handleGenerate();
            }
          }}
        />

        {/* Suggestions */}
        {!editedImageUrl && !isGenerating && (
          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>Suggestions</span>
            <div className={styles.suggestionsWrap}>
              {PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={styles.suggestionChip}
                  onClick={() => setPrompt(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Loading */}
        {isGenerating && (
          <div className={styles.loadingRow}>
            <Loader2 size={16} className={styles.spinner} />
            <span>Generating edited image...</span>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {editedImageUrl ? (
            <>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setEditedImageUrl(null);
                  setError(null);
                }}
              >
                Try Again
              </button>
              <button className={styles.primaryButton} onClick={handleSave}>
                Save Image
              </button>
            </>
          ) : (
            <button
              className={styles.primaryButton}
              onClick={() => void handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
