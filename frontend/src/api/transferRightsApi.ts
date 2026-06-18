// src/api/transferRightsApi.ts
import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { ManagerDto, ManagedItemDto, TransferRightsRequest } from '../types/admin.types';

export const transferRightsApi = {
    /** 
     * GET /api/v1/admin/transfer-rights/managers
     * type: 1 (Facilities), 2 (Theater), 3 (Movie)
     */
    getManagers: async (type: number): Promise<ApiSuccessResponse<ManagerDto[]>> => {
        const response = await identityAxios.get<ApiSuccessResponse<ManagerDto[]>>(
            `/admin/transfer-rights/managers?type=${type}`
        );
        return response.data;
    },

    /** 
     * GET /api/v1/admin/transfer-rights/managed-items
     * GET /api/v1/admin/transfer-rights/managed-items/{userId}
     * type: 1 (Facilities), 2 (Theater), 3 (Movie)
     */
    getManagedItems: async (type: number, userId?: string): Promise<ApiSuccessResponse<ManagedItemDto[]>> => {
        const url = userId 
            ? `/admin/transfer-rights/managed-items/${userId}?type=${type}`
            : `/admin/transfer-rights/managed-items?type=${type}`;
            
        const response = await identityAxios.get<ApiSuccessResponse<ManagedItemDto[]>>(url);
        return response.data;
    },

    /** 
     * POST /api/v1/admin/transfer-rights/execute
     */
    executeTransfer: async (data: TransferRightsRequest): Promise<ApiSuccessResponse> => {
        const response = await identityAxios.post<ApiSuccessResponse>(
            '/admin/transfer-rights/execute',
            data
        );
        return response.data;
    }
};
