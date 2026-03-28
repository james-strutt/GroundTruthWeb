import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../services/aiService', () => ({
  editImageWithAI: vi.fn(),
  extractJsonFromResponse: vi.fn(),
}));

vi.mock('../../../hooks/useCooldown', () => ({
  useCooldown: () => [false, 0, vi.fn()] as const,
}));

import { ImageEditModal } from '../ImageEditModal';

const defaultProps = {
  visible: true,
  photoUrl: 'https://example.com/photo.jpg',
  onClose: vi.fn(),
  onSave: vi.fn(),
};

describe('ImageEditModal', () => {
  it('does not render when visible is false', () => {
    const { container } = render(
      <ImageEditModal {...defaultProps} visible={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the prompt input when visible is true', () => {
    render(<ImageEditModal {...defaultProps} />);
    const textarea = screen.getByLabelText('Describe your edit');
    expect(textarea).toBeInTheDocument();
  });

  it('renders the photo preview when visible', () => {
    render(<ImageEditModal {...defaultProps} />);
    const img = screen.getByAltText('Preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders the modal title', () => {
    render(<ImageEditModal {...defaultProps} />);
    expect(screen.getByText('AI Image Edit')).toBeInTheDocument();
  });

  it('shows the Generate button as disabled when prompt is empty', () => {
    render(<ImageEditModal {...defaultProps} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('renders suggestion chips', () => {
    render(<ImageEditModal {...defaultProps} />);
    expect(screen.getByText('Remove the fence and show the view behind')).toBeInTheDocument();
    expect(screen.getByText('Show with new terracotta roof tiles')).toBeInTheDocument();
  });
});
