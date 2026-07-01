import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { API_BASE_URL } from './axiosClient';

const hubUrl = () => {
  const base = API_BASE_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/hubs/cinema`;
};

const createConnection = (params: Record<string, string>) => {
  const query = new URLSearchParams(params);

  return new HubConnectionBuilder()
    .withUrl(`${hubUrl()}?${query.toString()}`, {
      withCredentials: true,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
};

export const signalrClient = {
  createSeatConnection: (scheduleId: string, clientId: string): HubConnection =>
    createConnection({ groupType: 'seats', scheduleId, clientId }),

  createPaymentConnection: (orderId: string): HubConnection =>
    createConnection({ groupType: 'payment', orderId }),

  createGroupConnection: (groupSessionId: string): HubConnection =>
    createConnection({ groupType: 'group', groupSessionId }),
};

export const stopConnection = async (connection: HubConnection | null) => {
  if (!connection || connection.state === HubConnectionState.Disconnected) return;
  await connection.stop();
};
