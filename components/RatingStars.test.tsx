// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RatingStars } from './RatingStars';

describe('RatingStars Component', () => {
  it('strictly renders 5 stars and never 10 stars', () => {
    render(<RatingStars rating={3.5} readOnly={true} />);

    // Query all rendered star elements
    const stars = screen.getAllByTestId(/^star-\d+$/);
    expect(stars).toHaveLength(5);
  });

  it('displays the numeric label formatted as X.X / 5.0 when showLabel is true', () => {
    render(<RatingStars rating={4.2} showLabel={true} readOnly={true} />);

    const label = screen.getByTestId('rating-label');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('4.2 / 5.0');
  });

  it('renders filled stars with amber-500 class', () => {
    render(<RatingStars rating={3.0} readOnly={true} />);

    const fillStar1 = screen.getByTestId('star-fill-1');
    const fillStar3 = screen.getByTestId('star-fill-3');

    expect(fillStar1.querySelector('svg')).toHaveClass('text-amber-500');
    expect(fillStar3.querySelector('svg')).toHaveClass('text-amber-500');
  });

  it('accurately renders partial / half-star width percentages', () => {
    render(<RatingStars rating={2.5} readOnly={true} />);

    // Star 1: 100%
    const fill1 = screen.getByTestId('star-fill-1');
    expect(fill1).toHaveStyle({ width: '100%' });

    // Star 2: 100%
    const fill2 = screen.getByTestId('star-fill-2');
    expect(fill2).toHaveStyle({ width: '100%' });

    // Star 3 (half star): 50%
    const fill3 = screen.getByTestId('star-fill-3');
    expect(fill3).toHaveStyle({ width: '50%' });

    // Star 4 & 5 should not have fill element
    expect(screen.queryByTestId('star-fill-4')).toBeNull();
    expect(screen.queryByTestId('star-fill-5')).toBeNull();
  });

  it('fires onChange callback with value in range 0.0 to 5.0 when interactive', () => {
    const handleChange = vi.fn();
    render(<RatingStars rating={2.0} onChange={handleChange} readOnly={false} />);

    const star4 = screen.getByTestId('star-4');
    
    // Simulate clicking on the star
    fireEvent.click(star4);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const calledValue = handleChange.mock.calls[0][0];
    expect(calledValue).toBeGreaterThanOrEqual(0);
    expect(calledValue).toBeLessThanOrEqual(5.0);
  });

  it('clamps values above 5.0 to maximum 5.0 and values below 0 to 0.0', () => {
    const { rerender } = render(<RatingStars rating={8.5} showLabel={true} readOnly={true} />);
    expect(screen.getByTestId('rating-label').textContent).toBe('5.0 / 5.0');

    rerender(<RatingStars rating={-2} showLabel={true} readOnly={true} />);
    expect(screen.getByTestId('rating-label').textContent).toBe('0.0 / 5.0');
  });

  it('supports keyboard arrows navigation in interactive mode', () => {
    const handleChange = vi.fn();
    render(<RatingStars rating={3.0} onChange={handleChange} readOnly={false} />);

    const star3 = screen.getByTestId('star-3');
    star3.focus();

    fireEvent.keyDown(star3, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(3.5);

    fireEvent.keyDown(star3, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(2.5);
  });
});
