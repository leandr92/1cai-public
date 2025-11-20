import { WikiApi as RealApi } from './client';
import { WikiApi as MockApi, useMock } from './mockClient';

// Re-export the correct API based on environment
export const WikiApi = useMock ? MockApi : RealApi;

