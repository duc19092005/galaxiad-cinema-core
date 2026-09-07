import type { ContractMovieLine, ScopeState } from '../../types/contract.types';
import type { MovieRequiredAge } from '../../types/movie.types';
import type { Cinema, MovieFormat } from '../../types/facilities.types';

const scope = (value: unknown): ScopeState => value === 'SPECIFIED' ? 'Specified'
  : value === 'NO_ADDITIONAL_RESTRICTION_CONFIRMED' ? 'NoAdditionalRestrictionConfirmed' : 'Unresolved';
const text = (value: unknown) => typeof value === 'string' ? value : '';
const date = (value: unknown) => {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const names = (value: unknown): string[] => Array.isArray(value) ? value.filter(x => typeof x === 'string') : [];

export function extractMovieDrafts(json: string, ages: MovieRequiredAge[], cinemas: Cinema[], formats: MovieFormat[]): ContractMovieLine[] {
  let movies: Record<string, unknown>[];
  try { movies = JSON.parse(json).analysis?.movies; } catch { return []; }
  if (!Array.isArray(movies)) return [];
  return movies.filter(m => m && typeof m === 'object').map(m => {
    const cinemaNames = names(m.cinemaNames);
    const formatNames = names(m.formatNames);
    const cinemaIds = cinemaNames.flatMap(name => cinemas.filter(c => c.cinemaName.toLocaleLowerCase() === name.toLocaleLowerCase()).map(c => c.cinemaId));
    const formatIds = formatNames.flatMap(name => formats.filter(f => f.formatName.toLowerCase() === name.toLowerCase()).map(f => f.formatId));
    return {
      vietnameseTitle: text(m.vietnameseTitle), englishTitle: text(m.englishTitle),
      description: text(m.description), posterUrl: text(m.posterUrl), trailerUrl: text(m.trailerUrl),
      director: text(m.director), actors: Array.isArray(m.actors) ? names(m.actors).join(', ') : text(m.actors),
      durationMinutes: number(m.durationMinutes),
      movieRequiredAgeId: ages.find(a => a.movieRequiredAgeSymbol.toUpperCase() === text(m.ageRating).toUpperCase())?.movieRequiredAgeSymbolId || '',
      licenseStartAt: date(m.licenseStartAt), licenseEndAt: date(m.licenseEndAt),
      cinemaScopeState: scope(m.cinemaScopeState) === 'Specified' && (!cinemaNames.length || cinemaIds.length !== cinemaNames.length) ? 'Unresolved' : scope(m.cinemaScopeState),
      formatScopeState: scope(m.formatScopeState) === 'Specified' && (!formatNames.length || formatIds.length !== formatNames.length) ? 'Unresolved' : scope(m.formatScopeState),
      cinemaIds, formatIds, cinemaSharePercent: number(m.cinemaSharePercent), distributorSharePercent: number(m.distributorSharePercent),
      revenueBasis: text(m.revenueBasis), settlementCycle: text(m.settlementCycle).toUpperCase() === 'WEEKLY' ? 'Weekly' : 'Monthly',
      reviewed: false,
    };
  });
}
