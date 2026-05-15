import { apiRequest } from './apiClient';

export interface BlockClientRequest {
  clientId: string;
  reason?: string;
}

export interface BlockClientResponse {
  success: boolean;
  message: string;
  blockedClient?: BlockedClient;
}

export interface UnblockClientResponse {
  success: boolean;
  message: string;
}

export interface BlockedClient {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  artistId?: string;
  salonId?: string;
  reason?: string;
  blockedAt: string;
  blockedByUserName: string;
}

export interface BlockedClientsResponse {
  blockedClients: BlockedClient[];
}

export async function blockClientForArtist(artistId: string, request: BlockClientRequest): Promise<BlockClientResponse> {
  return apiRequest<BlockClientResponse>(`/blockedclients/artist/${artistId}`, {
    method: 'POST',
    body: request,
  });
}

export async function blockClientForSalon(salonId: string, request: BlockClientRequest): Promise<BlockClientResponse> {
  return apiRequest<BlockClientResponse>(`/blockedclients/salon/${salonId}`, {
    method: 'POST',
    body: request,
  });
}

export async function unblockClient(blockedClientId: string): Promise<UnblockClientResponse> {
  return apiRequest<UnblockClientResponse>(`/blockedclients/${blockedClientId}`, {
    method: 'DELETE',
  });
}

export async function getBlockedClientsForArtist(): Promise<BlockedClientsResponse> {
  return apiRequest<BlockedClientsResponse>('/blockedclients/artist');
}

export async function getBlockedClientsForSalon(): Promise<BlockedClientsResponse> {
  return apiRequest<BlockedClientsResponse>('/blockedclients/salon');
}













