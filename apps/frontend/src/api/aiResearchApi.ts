import { API_BASE_URL, identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
  AiResearchJobDetail,
  AiResearchJobSummary,
  AiResearchProgress,
  AiResearchSseEvent,
  CreateAiResearchJobRequest,
} from '../types/aiResearch.types';

const unwrap = <T>(payload: ApiSuccessResponse<T>): T => {
  if (!payload.isSuccess || payload.data === undefined || payload.data === null) {
    throw new Error(payload.message || 'AI research request failed.');
  }
  return payload.data;
};

const parseSseBlock = (block: string): AiResearchSseEvent | null => {
  let id: string | undefined;
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('id:')) id = line.slice(3).trim();
    else if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  return { id, event, data: JSON.parse(dataLines.join('\n')) as AiResearchProgress };
};

export const aiResearchApi = {
  createJob: async (request: CreateAiResearchJobRequest): Promise<AiResearchJobSummary> => {
    const response = await identityAxios.post<ApiSuccessResponse<AiResearchJobSummary>>(
      '/admin/ai-research/jobs',
      request,
    );
    return unwrap(response.data);
  },

  listJobs: async (): Promise<AiResearchJobSummary[]> => {
    const response = await identityAxios.get<ApiSuccessResponse<AiResearchJobSummary[]>>(
      '/admin/ai-research/jobs',
    );
    return unwrap(response.data);
  },

  getJob: async (jobId: string): Promise<AiResearchJobDetail> => {
    const response = await identityAxios.get<ApiSuccessResponse<AiResearchJobDetail>>(
      `/admin/ai-research/jobs/${jobId}`,
    );
    return unwrap(response.data);
  },

  cancelJob: async (jobId: string): Promise<void> => {
    await identityAxios.post(`/admin/ai-research/jobs/${jobId}/cancel`);
  },

  streamEvents: async (
    jobId: string,
    onEvent: (event: AiResearchSseEvent) => void,
    signal: AbortSignal,
    afterEventId = 0,
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/ai-research/jobs/${jobId}/events?afterEventId=${afterEventId}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'text/event-stream' },
        signal,
      },
    );
    if (!response.ok || !response.body) {
      throw new Error(`SSE connection failed (${response.status}).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);
        if (block && !block.startsWith(':')) {
          const parsed = parseSseBlock(block);
          if (parsed) onEvent(parsed);
        }
        boundary = buffer.indexOf('\n\n');
      }
      if (done) break;
    }
  },
};
