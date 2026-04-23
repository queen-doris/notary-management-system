/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export interface IResponse<T = any> {
  status: 'SUCCESS' | 'ERROR';
  timestamp: string;
  path: string;
  data?: T | any;
  message?: string;
  error?: any;
}
