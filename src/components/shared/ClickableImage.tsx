/**
 * Image that opens in a full-screen lightbox on click.
 */

import { useState } from 'react';
import { Lightbox } from './Lightbox';

interface ClickableImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ClickableImage({ src, alt, className, style }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt ?? ''}
        className={className}
        style={{ ...style, cursor: 'pointer' }}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && <Lightbox src={src} alt={alt} onClose={() => setIsOpen(false)} />}
    </>
  );
}
