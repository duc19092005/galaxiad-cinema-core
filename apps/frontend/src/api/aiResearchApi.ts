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
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join('\n');
  try {
    return { id, event, data: JSON.parse(raw) as AiResearchProgress };
  } catch {
    return null;
  }
};

export const aiResearchApi = {
  createJob: async (request: CreateAiResearchJobRequest): Promise<AiResearchJobSummary> => {
    const response = await identityAxios.post<ApiSuccessResponse<AiResearchJobSummary>>(
      '/admin/ai-research/jobs',
      request,
      // Job create is fast; pipeline runs in Hangfire.
      { timeout: 30000 },
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

  /**
   * Long-lived SSE reader with automatic resume after disconnect.
   * Uses cookie auth (credentials: include) same as the rest of the admin app.
   */
  streamEvents: async (
    jobId: string,
    onEvent: (event: AiResearchSseEvent) => void,
    signal: AbortSignal,
    afterEventId = 0,
  ): Promise<void> => {
    let cursor = afterEventId;
    let attempt = 0;

    while (!signal.aborted) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/admin/ai-research/jobs/${jobId}/events?afterEventId=${cursor}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
            signal,
          },
        );
        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed (${response.status}).`);
        }

        attempt = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let boundary = buffer.indexOf('\n\n');
          while (boundary >= 0) {
            const block = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            if (block && !block.startsWith(':')) {
              const parsed = parseSseBlock(block);
              if (parsed) {
                if (parsed.id) {
                  const numericId = Number(parsed.id);
                  if (Number.isFinite(numericId)) cursor = Math.max(cursor, numericId);
                }
                onEvent(parsed);
                if (parsed.event === 'done' || parsed.event === 'failed' || parsed.event === 'cancelled') {
                  return;
                }
              }
            }
            boundary = buffer.indexOf('\n\n');
          }
        }

        // Stream ended without a terminal event — resume after a short backoff.
        attempt += 1;
        if (signal.aborted) return;
        await sleep(Math.min(4000, 500 * attempt), signal);
      } catch (error) {
        if (signal.aborted) return;
        attempt += 1;
        if (attempt > 12) {
          throw error instanceof Error ? error : new Error('Mất kết nối SSE.');
        }
        await sleep(Math.min(5000, 600 * attempt), signal);
      }
    }
  },
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
