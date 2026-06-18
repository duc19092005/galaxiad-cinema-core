// src/api/recommendationApi.ts
import { identityAxios } from './axiosClient';

const BASE = '/recommendation';

export interface GenreItem {
  genreId: string;
  genreName: string;
}

export interface SurveyStatusResponse {
  hasCompletedSurvey: boolean;
  preferredGenreIds: string[];
  preferenceDescription: string;
}

export interface RecommendedMovie {
  movieId: string;
  movieName: string;
  moviePosterURL: string;
  movieBannerURL: string;
  movieDescription: string;
  movieGenres: string;
  movieFormatInfos: string;
  movieRequiredAge: string;
  movieDuration: number;
  isCommingSoon: boolean;
  similarityScore: number;
}

export const recommendationApi = {
  /** Get survey completion status and saved preferences */
  getSurveyStatus: async (): Promise<{ data: SurveyStatusResponse; isSuccess: boolean }> => {
    const res = await identityAxios.get<{ data: SurveyStatusResponse; isSuccess: boolean }>(
      `${BASE}/survey/status`
    );
    return res.data;
  },

  /** Save / update the user's genre preferences */
  saveSurvey: async (
    preferredGenreIds: string[],
    preferenceDescription: string
  ): Promise<{ isSuccess: boolean; message?: string }> => {
    const res = await identityAxios.post<{ isSuccess: boolean; message?: string }>(
      `${BASE}/survey`,
      { preferredGenreIds, preferenceDescription }
    );
    return res.data;
  },

  /** Fetch personalised movie recommendations for the logged-in user */
  getRecommendations: async (): Promise<{ data: RecommendedMovie[]; isSuccess: boolean }> => {
    const res = await identityAxios.get<{ data: RecommendedMovie[]; isSuccess: boolean }>(
      `${BASE}/movies`
    );
    return res.data;
  },
};
