import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes the value via ARIA progressbar attributes', () => {
    render(<ProgressBar value={42} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('sizes the fill element to match the given percentage', () => {
    render(<ProgressBar value={75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.firstChild).toHaveStyle({ width: '75%' });
  });

  it('renders a 0% fill for zero progress', () => {
    render(<ProgressBar value={0} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar.firstChild).toHaveStyle({ width: '0%' });
  });
});
