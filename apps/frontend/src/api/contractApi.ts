import { movieAxios } from './axiosClient';
import type { ContractDetail, ContractMovieLine, ContractSummary, ContractTemplate } from '../types/contract.types';

interface Envelope<T> { isSuccess: boolean; data: T; message?: string }

export const contractApi = {
  list: async (status?: string) => (await movieAxios.get<Envelope<ContractSummary[]>>('/contracts', { params: status ? { status } : {} })).data,
  get: async (id: string) => (await movieAxios.get<Envelope<ContractDetail>>(`/contracts/${id}`)).data,
  create: async (body: { distributorName?: string; counterpartyContractNumber?: string; templateId?: string; isDemo?: boolean }) =>
    (await movieAxios.post<Envelope<{ id: string; internalCode: string }>>('/contracts', body)).data,
  upload: async (id: string, file: File, kind = 'Original') => {
    const data = new FormData(); data.append('file', file); data.append('kind', kind);
    return (await movieAxios.post(`/contracts/${id}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })).data;
  },
  openDocument: async (contractId: string, documentId: string, fileName: string) => {
    const response = await movieAxios.get(`/contracts/${contractId}/documents/${documentId}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a'); anchor.href = url; anchor.target = '_blank'; anchor.download = fileName; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  extract: async (id: string) => (await movieAxios.post(`/contracts/${id}/extractions`)).data,
  review: async (id: string, movieLines: ContractMovieLine[], financialPolicyReviewed: boolean) =>
    (await movieAxios.put(`/contracts/${id}/extraction-review`, { movieLines, financialPolicyReviewed })).data,
  submit: async (id: string) => (await movieAxios.post(`/contracts/${id}/submit`)).data,
  approve: async (id: string) => (await movieAxios.post(`/contracts/${id}/approve`)).data,
  returnForRevision: async (id: string, reason: string) => (await movieAxios.post(`/contracts/${id}/return`, { reason })).data,
  sign: async (id: string, password: string) => (await movieAxios.post(`/contracts/${id}/sign`, { password })).data,
  activate: async (id: string) => (await movieAxios.post(`/contracts/${id}/activate`)).data,
  templates: async () => (await movieAxios.get<Envelope<ContractTemplate[]>>('/contract-templates')).data,
  createTemplate: async (body: Pick<ContractTemplate, 'code' | 'name' | 'schemaJson' | 'bodyTemplate'>) =>
    (await movieAxios.post('/contract-templates', body)).data,
  publishTemplate: async (id: string) => (await movieAxios.post(`/contract-templates/${id}/publish`)).data,
  proposeMovieChange: async (movieId: string, reason: string, proposedChangesJson: string) =>
    (await movieAxios.post(`/movies/${movieId}/change-requests`, { reason, proposedChangesJson })).data,
  submitMovieChange: async (id: string) => (await movieAxios.post(`/movie-change-requests/${id}/submit`)).data,
};
