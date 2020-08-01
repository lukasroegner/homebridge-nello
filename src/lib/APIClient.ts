import request from 'request';
import { AUTH_URI } from '../config';

export class APIClient {
  constructor(
    private baseUrl: string,
    private log: (message: string) => void,
    private onSuccess: () => void,
    private onError: (message: string) => void,
    private grantFormParameters: Record<string, string>,
  ) {
  }

  private token: string | undefined;

  isSignedIn(): boolean {
    return this.token !== undefined;
  }

  setToken(token: string): void {
    this.token = token;
  }

  resetToken(): void {
    this.token = undefined;
  }

  async signIn(): Promise<void> {
    this.resetToken();

    // https://nelloauth.docs.apiary.io/#reference/0/token/
    const response = await this.baseRequest<{
      scope: string,
      token_type: string,
      access_token: string,
      refresh_token?: string,
    }, undefined>(
      'POST',
      `${AUTH_URI}/oauth/token/`,
      undefined,
      this.grantFormParameters,
    );

    if (!response?.token_type || !response?.access_token) {
      this.onError(`Error while signing in. Could not get access token from response: ${JSON.stringify(response)}`);
      return;
    }

    this.setToken(`${response.token_type} ${response.access_token}`);
  }

  async request<TResponse = undefined, TBody = undefined>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: TBody | undefined = undefined,
    retried = false,
  ): Promise<TResponse> {
    const url = `${retried ? '' : this.baseUrl}${path}`;
    const logPart = `${method} ${url}`;
    this.log(`Request: ${logPart}`);

    try {
      if (!this.token) {
        this.log('Not signed in, requesting sign-in');
        await this.signIn();
      }

      return await this.baseRequest(method, url, body);
    } catch (e) {
      if (!retried) {
        this.log(`Retrying request: ${logPart}`);
        return this.request(method, url, body, true);
      }
      throw e;
    }
  }

  private baseRequest<TResponse, TBody>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: TBody | undefined = undefined,
    form: Record<string, string> | undefined = undefined,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      request({
        uri: path,
        method,
        headers: {
          Authorization: this.token,
        },
        form,
        json: body ?? true,
      }, (error, response, responseBody) => {
        if (error || response.statusCode !== 200) {
          const message = `API error path=${path}, status_code=${response.statusCode}, response=${JSON.stringify(responseBody, null, 2)}`;

          this.onError(message);

          reject(message);
          return;
        }

        this.onSuccess();
        resolve(responseBody);
      });
    });
  }
}
