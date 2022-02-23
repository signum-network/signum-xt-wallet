import { Http, HttpError, HttpResponse } from '@signumjs/http';

export class HttpAdapterFetch implements Http {
  constructor(private baseURL: string) {
    this.baseURL = !baseURL.endsWith('/') ? baseURL + '/' : baseURL;
  }

  private static mountError(url: string, error: any): HttpError {
    if (error.response) {
      return new HttpError(url, error.response.status, error.response.statusText, error.response.data);
    } else if (error.message) {
      return new HttpError(url, 0, 'Request failed', error.message);
    }
    return new HttpError(url, -1, 'Unknown Http error', null);
  }

  private async fetcher(method: 'get' | 'post' | 'delete' | 'put', url: string, payload?: any) {
    const normalizedUrl = url.startsWith('/') ? url.substr(1) : url;
    try {
      const response = await fetch(this.baseURL + normalizedUrl, { method, mode: 'cors', body: payload });
      const data = await response.json();
      if (response.ok) {
        return new HttpResponse(response.status, data);
      }
      const error = {
        status: response.status,
        statusText: response.statusText,
        data
      };

      throw HttpAdapterFetch.mountError(url, error);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      } else {
        throw HttpAdapterFetch.mountError(url, error);
      }
    }
  }

  async get(url: string, options?: any): Promise<HttpResponse> {
    return this.fetcher('get', url);
  }

  async post(url: string, payload: any, options?: any): Promise<HttpResponse> {
    return this.fetcher('post', url, payload);
  }

  async put(url: string, payload: any, options?: any): Promise<HttpResponse> {
    return this.fetcher('put', url, payload);
  }

  async delete(url: string, options?: any): Promise<HttpResponse> {
    return this.fetcher('delete', url);
  }
}
