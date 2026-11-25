import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { Keyboard } from '../../src/ui/Keyboard';
import { KeyStrip } from '../../src/ui/KeyStrip';
import { Hand } from '../../src/ui/Hand';

test('Keyboard renders the range, letters, glow finger and middle C marker', () => {
  render(<Keyboard low={60} high={72} glow={{ midi: 64, finger: 3 }} middleC />);
  expect(screen.getAllByTestId(/^key-/)).toHaveLength(13);
  expect(screen.getByTestId('key-64')).toHaveAttribute('data-glow', 'true');
  expect(within(screen.getByTestId('key-64')).getByText('3')).toBeTruthy();
  expect(screen.getByTestId('middle-c-marker')).toBeTruthy();
});

test('wobble and sparkle flags land on the right key', () => {
  render(<Keyboard low={60} high={72} wobble={62} sparkle={64} />);
  expect(screen.getByTestId('key-62')).toHaveAttribute('data-wobble', 'true');
  expect(screen.getByTestId('key-64')).toHaveAttribute('data-sparkle', 'true');
  expect(screen.getByTestId('key-60')).not.toHaveAttribute('data-wobble');
});

test('onTap reports the key', () => {
  const onTap = vi.fn(); render(<Keyboard low={60} high={72} onTap={onTap} />);
  fireEvent.pointerDown(screen.getByTestId('key-62')); expect(onTap).toHaveBeenCalledWith(62);
});

test('KeyStrip shows all 61 keys and the range', () => {
  render(<KeyStrip low={60} high={72} />);
  expect(screen.getAllByTestId(/^strip-key-/)).toHaveLength(61);
  expect(screen.getByTestId('strip-range')).toBeTruthy();
});

test('Hand has five labelled fingers, highlighted one filled', () => {
  render(<Hand highlight={2} color="#123456" />);
  for (const n of [1, 2, 3, 4, 5]) expect(screen.getByTestId(`finger-${n}`)).toBeTruthy();
  expect(screen.getByTestId('finger-2').querySelector('[fill="#123456"]')).toBeTruthy();
  expect(screen.getByTestId('finger-3').querySelector('[fill="#123456"]')).toBeNull();
});

test('black keys are 70% of a white key wide', () => {
  render(<Keyboard low={60} high={72} />);
  const white = parseFloat(screen.getByTestId('key-60').style.width);
  const black = parseFloat(screen.getByTestId('key-61').style.width);
  expect(black / white).toBeCloseTo(0.7);
});

test('changing feedbackId replays sparkle on the same key', () => {
  const { rerender } = render(<Keyboard low={60} high={72} sparkle={64} feedbackId={1} />);
  const before = screen.getByTestId('sparkle');
  rerender(<Keyboard low={60} high={72} sparkle={64} feedbackId={2} />);
  expect(screen.getByTestId('sparkle')).not.toBe(before);
});

test('labels put finger numbers on keys besides the glowing one', () => {
  render(<Keyboard low={60} high={72} glow={{ midi: 60, finger: 1 }} labels={{ 60: 3, 62: 2, 64: 3 }} />);
  expect(within(screen.getByTestId('key-60')).getByText('1')).toBeTruthy();
  expect(within(screen.getByTestId('key-62')).getByText('2')).toBeTruthy();
  expect(within(screen.getByTestId('key-64')).getByText('3')).toBeTruthy();
  expect(within(screen.getByTestId('key-65')).queryByText(/\d/)).toBeNull();
});
