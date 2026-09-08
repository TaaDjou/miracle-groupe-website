import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders 5 stars with the correct ones filled in read-only mode', () => {
    render(<StarRating value={3} />);

    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
    expect(stars[0]).toHaveClass('filled');
    expect(stars[2]).toHaveClass('filled');
    expect(stars[3]).not.toHaveClass('filled');
  });

  it('renders plain spans (not buttons) when read-only', () => {
    render(<StarRating value={2} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders interactive buttons and calls onChange with the clicked star number', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} readOnly={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    fireEvent.click(buttons[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('rounds a fractional value to decide which stars are filled', () => {
    render(<StarRating value={3.6} />);
    const stars = screen.getAllByText('★');
    expect(stars[3]).toHaveClass('filled');
    expect(stars[4]).not.toHaveClass('filled');
  });
});
