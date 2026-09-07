import { describe, it, expect } from 'vitest';
import { extractMovieDrafts } from './contractExtraction';

describe('contract OCR draft mapping', () => {
  it('preserves Unicode, partner assets and zero percent without marking AI data reviewed', () => {
    const [line] = extractMovieDrafts(JSON.stringify({ analysis: { movies: [{ vietnameseTitle: 'DUNE: HÀNH TINH CÁT', description: 'Phần Hai tiếp tục cuộc hành trình', posterUrl: 'https://example.org/poster.jpg', cinemaSharePercent: 0, distributorSharePercent: 100 }] } }), [], [], []);
    expect(line.description).toBe('Phần Hai tiếp tục cuộc hành trình');
    expect(line.posterUrl).toBe('https://example.org/poster.jpg');
    expect(line.cinemaSharePercent).toBe(0);
    expect(line.reviewed).toBe(false);
    expect(line.movieRequiredAgeId).toBe('');
    expect(line.cinemaScopeState).toBe('Unresolved');
  });
  it('does not discard unmatched cinema restrictions or invent a date', () => {
    const [line] = extractMovieDrafts(JSON.stringify({ analysis: { movies: [{ cinemaScopeState: 'SPECIFIED', cinemaNames: ['Unknown theater'], licenseEndAt: 'not a date' }] } }), [], [], []);
    expect(line.cinemaScopeState).toBe('Unresolved');
    expect(line.licenseEndAt).toBe('');
    expect(line.durationMinutes).toBe(0);
  });
  it('handles invalid or absent analysis without crashing the review page', () => {
    expect(extractMovieDrafts('invalid', [], [], [])).toEqual([]);
    expect(extractMovieDrafts('{}', [], [], [])).toEqual([]);
  });
});
