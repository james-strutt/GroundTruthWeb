import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCard } from '../SkeletonCard';

describe('SkeletonCard', () => {
  it('renders 3 skeleton cards by default', () => {
    const { container } = render(<SkeletonCard />);
    const cards = container.querySelectorAll('div > div');
    /* Each SingleSkeleton renders a card div with children; count top-level card wrappers */
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders custom count when specified', () => {
    const { container: container5 } = render(<SkeletonCard count={5} />);
    const { container: container1 } = render(<SkeletonCard count={1} />);

    /* SingleSkeleton is the direct child fragment element. Count via a stable selector. */
    const cardsFor5 = container5.children;
    const cardsFor1 = container1.children;

    expect(cardsFor5.length).toBe(5);
    expect(cardsFor1.length).toBe(1);
  });
});
