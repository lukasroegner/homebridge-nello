import type { Logging } from 'homebridge';
import request from 'request';

import { AUTH_URI } from '../config';

import { Location } from './Location';
import { WebhookAction } from './WebhookData';

export class APIClient {
  constructor(
    private baseUrl: string,
    private log: Logging,
    private grantFormParameters: Record<string, string>,
    private updateReachability: (reachable: boolean) => void,
  ) {
  }

  private token: string | undefined;

  private timeoutUntil: Date | undefined;

  // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/open-door
  async openLocation(location: Location): Promise<void> {
    await this.request(
      'PUT',
      `/locations/${location.location_id}/open/`,
    );
  }

  // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/list-locations
  async getLocations(): Promise<Location[]> {
    const response = await this.request<{ data: Location[] }>('GET', '/locations/');

    if (!response?.data) {
      throw new Error(`Could not get locations from response: ${JSON.stringify(response)}`);
    }

    return response.data;
  }

  // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/add-/-update-webhook
  async updateWebhook(location: Location, uri: string): Promise<void> {
    return this.request(
      'PUT',
      `/locations/${location.location_id}/webhook/`,
      {
        url: uri,
        actions: Object.values(WebhookAction),
      },
    );
  }

  private async request<TResponse = undefined, TBody = undefined>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: TBody | undefined = undefined,
    retried = false,
  ): Promise<TResponse> {
    const url = `${retried ? '' : this.baseUrl}${path}`;
    const logPart = `${method} ${url}`;
    this.log(`START Request: ${logPart}`);

    try {
      if (!this.token) {
        this.log('Not signed in, requesting sign-in');
        await this.signIn();
      }

      const response = await this.baseRequest<TResponse, TBody>(method, url, body);

      this.log(`COMPLETE Request: ${logPart}`);

      return response;
    } catch (e) {
      if (!retried) {
        this.log(`RETRY Request: ${logPart}`);
        return this.request(method, url, body, true);
      }
      throw e;
    }
  }

  private setToken(token: string): void {
    this.token = token;
  }

  private resetToken(): void {
    this.token = undefined;
  }

  private async signIn(): Promise<void> {
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
      this.log.error(`Error while signing in. Could not get access token from response: ${JSON.stringify(response)}`);
      return;
    }

    this.setToken(`${response.token_type} ${response.access_token}`);
  }

  private async baseRequest<TResponse, TBody>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: TBody | undefined = undefined,
    form: Record<string, string> | undefined = undefined,
  ): Promise<TResponse> {
    const now = new Date().valueOf();
    const waitUntil = this.timeoutUntil?.valueOf();

    if (waitUntil && now < waitUntil) {
      const waitTime = waitUntil - now;
      this.log.warn(`Rate-limited, waiting ${waitTime / 1000} seconds`);
      await new Promise((resolve) => { setTimeout(resolve, waitTime); });
    }

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

          if (response.statusCode === 429) {
            // 1 minute
            this.timeoutUntil = new Date(new Date().valueOf() + 1 * 60 * 1000);
          } else {
            this.updateReachability(false);
            this.resetToken();
          }

          this.log.warn(message);

          reject(new Error(message));
          return;
        }

        this.updateReachability(true);
        resolve(responseBody);
      });
    });
  }
}
