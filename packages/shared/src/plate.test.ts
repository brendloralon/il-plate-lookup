import { describe, expect, it } from 'vitest';
import { formatPlate, normalizePlate, padPlate8 } from './plate';

describe('normalizePlate', () => {
  it.each([
    ['12-345-67', '1234567'],
    ['123-45-678', '12345678'],
    [' 123 45 678 ', '12345678'],
    ['3432273', '3432273'],
    ['03602428', '3602428'],
    ['870', '870'],
    ['12', '12'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizePlate(input)).toBe(expected);
  });

  it.each(['', '1', '123456789', '12a3456', '12_345_67', '00000000', '01', '١٢٣٤٥٦٧'])(
    'rejects %j',
    (input) => {
      expect(normalizePlate(input)).toBeNull();
    },
  );
});

describe('padPlate8', () => {
  it('zero-pads to 8 characters', () => {
    expect(padPlate8('3602428')).toBe('03602428');
    expect(padPlate8('12345678')).toBe('12345678');
  });
});

describe('formatPlate', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '12-3'],
    ['12345', '12-345'],
    ['123456', '12-345-6'],
    ['1234567', '12-345-67'],
    ['12345678', '123-45-678'],
    ['123456789', '123-45-678'],
    ['12-345-67', '12-345-67'],
    ['ab12c', '12'],
  ])('formats %j as %j', (input, expected) => {
    expect(formatPlate(input)).toBe(expected);
  });
});
