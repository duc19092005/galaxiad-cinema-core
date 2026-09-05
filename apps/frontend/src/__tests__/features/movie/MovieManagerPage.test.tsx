import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoviesListTab } from '../../../features/movie/components/MoviesListTab';
import { MovieDetailModal } from '../../../features/movie/components/MovieDetailModal';
import {
    parsePeopleCsv,
    sameStringSet,
    ChoiceGroup,
    SelectableOption,
} from '../../../features/movie/components/MovieFormControls';
import type { Movie } from '../../../types/movie.types';

const mockMovie: Movie = {
    movieId: 'movie-123',
    movieName: 'Interstellar',
    movieDescriptions: 'A team of explorers travel through a wormhole in space.',
    movieImageUrl: 'https://example.com/poster.jpg',
    movieBannerUrl: 'https://example.com/banner.jpg',
    startedDate: '2026-01-01T00:00:00',
    endedDate: '2026-03-01T00:00:00',
    duration: 169,
    movieRequiredAgeSymbol: 'PG-13',
    movieRequiredAgeDescription: 'Parents Strongly Cautioned',
    movieGenresInfos: ['Sci-Fi', 'Adventure', 'Drama'],
    movieVisualFormatInfos: ['IMAX', '2D'],
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway',
    managerName: 'Manager John',
};

describe('MovieManagerPage components', () => {
    describe('MovieFormControls utility functions', () => {
        it('parsePeopleCsv splits comma, semicolon, or pipe separated strings correctly', () => {
            expect(parsePeopleCsv('Nolan, Tarantino; Spielberg | Cameron')).toEqual([
                'Nolan',
                'Tarantino',
                'Spielberg',
                'Cameron',
            ]);
            expect(parsePeopleCsv('')).toEqual([]);
        });

        it('sameStringSet checks unordered string equality correctly', () => {
            expect(sameStringSet(['a', 'b', 'c'], ['c', 'b', 'a'])).toBe(true);
            expect(sameStringSet(['a', 'b'], ['a', 'c'])).toBe(false);
            expect(sameStringSet(['a'], ['a', 'b'])).toBe(false);
        });

        it('SelectableOption renders option and responds to click', () => {
            const handleClick = vi.fn();
            render(
                <SelectableOption
                    label="IMAX 3D"
                    description="High definition 3D projection"
                    selected={false}
                    onClick={handleClick}
                />
            );

            expect(screen.getByText('IMAX 3D')).toBeInTheDocument();
            expect(screen.getByText('High definition 3D projection')).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('ChoiceGroup renders label and selection badge', () => {
            render(
                <ChoiceGroup label="Available Formats" selectedCount={2}>
                    <div>Option 1</div>
                    <div>Option 2</div>
                </ChoiceGroup>
            );

            expect(screen.getByText('Available Formats')).toBeInTheDocument();
            expect(screen.getByText('2 selected')).toBeInTheDocument();
            expect(screen.getByText('Option 1')).toBeInTheDocument();
        });
    });

    describe('MoviesListTab', () => {
        it('renders movie list properly', () => {
            const handleSearchChange = vi.fn();
            const handleCreateClick = vi.fn();
            const handleMovieClick = vi.fn();
            const handleEditClick = vi.fn();
            const handleDeleteClick = vi.fn();
            const handleAssignClick = vi.fn();

            render(
                <MoviesListTab
                    movies={[mockMovie]}
                    loading={false}
                    searchTerm=""
                    onSearchChange={handleSearchChange}
                    onCreateClick={handleCreateClick}
                    onMovieClick={handleMovieClick}
                    onEditClick={handleEditClick}
                    onDeleteClick={handleDeleteClick}
                    onAssignClick={handleAssignClick}
                    isAdmin={true}
                    formatDate={(d) => d}
                />
            );

            expect(screen.getByText('Interstellar')).toBeInTheDocument();
            expect(screen.getByText(/169m/)).toBeInTheDocument();
            expect(screen.getByText('Manager John')).toBeInTheDocument();
        });

        it('renders empty state when no movies found', () => {
            render(
                <MoviesListTab
                    movies={[]}
                    loading={false}
                    searchTerm="NonExistent"
                    onSearchChange={vi.fn()}
                    onCreateClick={vi.fn()}
                    onMovieClick={vi.fn()}
                    onEditClick={vi.fn()}
                    onDeleteClick={vi.fn()}
                    onAssignClick={vi.fn()}
                    isAdmin={false}
                    formatDate={(d) => d}
                />
            );

            expect(screen.getByText('No movies found')).toBeInTheDocument();
        });
    });

    describe('MovieDetailModal', () => {
        it('renders movie details when open', () => {
            const handleClose = vi.fn();
            render(
                <MovieDetailModal
                    movie={mockMovie}
                    isOpen={true}
                    onClose={handleClose}
                />
            );

            expect(screen.getByText('Interstellar')).toBeInTheDocument();
            expect(screen.getByText('Christopher Nolan')).toBeInTheDocument();
            expect(screen.getByText('Matthew McConaughey, Anne Hathaway')).toBeInTheDocument();
            expect(screen.getByText(/A team of explorers/)).toBeInTheDocument();
        });

        it('returns null when isOpen is false', () => {
            const { container } = render(
                <MovieDetailModal
                    movie={mockMovie}
                    isOpen={false}
                    onClose={vi.fn()}
                />
            );

            expect(container.firstChild).toBeNull();
        });
    });
});
