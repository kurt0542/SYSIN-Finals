const { computeTotalDuration, formatDuration } = require('../src/duration');

describe('Duration calculation and formatting unit tests', () => {
  test('returns 0 for empty songs list or non-array', () => {
    expect(computeTotalDuration([])).toBe(0);
    expect(computeTotalDuration(null)).toBe(0);
  });

  test('correctly computes sum of duration_seconds across songs', () => {
    const songs = [
      { id: 1, duration_seconds: 200 },
      { id: 2, duration_seconds: 150 },
      { id: 3, duration_seconds: 300 },
    ];
    // Expected: 200 + 150 + 300 = 650 seconds
    expect(computeTotalDuration(songs)).toBe(650);
  });

  test('formats durations under one hour correctly', () => {
    expect(formatDuration(185)).toBe('3m 5s');
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(45)).toBe('0m 45s');
  });

  test('formats durations over one hour correctly', () => {
    // 3725 seconds = 1 hour, 2 minutes, 5 seconds
    expect(formatDuration(3725)).toBe('1h 2m 5s');
  });
});
