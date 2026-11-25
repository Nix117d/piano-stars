import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { HoldButton } from '../../src/ui/HoldButton';

afterEach(() => vi.useRealTimers());

test('fires only after being held for the full time', () => {
  vi.useFakeTimers();
  const onHold = vi.fn();
  render(<HoldButton ms={3000} onHold={onHold} />);
  const button = screen.getByTestId('hold-button');
  fireEvent.pointerDown(button);
  vi.advanceTimersByTime(2999);
  expect(onHold).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(onHold).toHaveBeenCalledOnce();
});

test('letting go early cancels the hold', () => {
  vi.useFakeTimers();
  const onHold = vi.fn();
  render(<HoldButton ms={3000} onHold={onHold} />);
  const button = screen.getByTestId('hold-button');
  fireEvent.pointerDown(button);
  vi.advanceTimersByTime(2000);
  fireEvent.pointerUp(button);
  vi.advanceTimersByTime(5000);
  expect(onHold).not.toHaveBeenCalled();
});
