// https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/add-/-update-webhook
export type WebhookData = {
  action: WebhookAction;
  data: {
    location_id: string;
    name: string;
  };
} | {
  action: WebhookAction.DidNotOpen;
  data: {
    location_id: string;
  };
};

export enum WebhookAction {
  /** When the door opens */
  Swipe = 'swipe',
  /** When the door is opened because of the Homezone Unlock feature (with a bell ring) */
  HomeZoneUnlock = 'geo',
  /** When the door is opened because of a Time Window (with a bell ring) */
  TimeWindow = 'tw',
  /** When nello detects a bell ring, but neither a Time Window
   * nor a Homezone Event caused the door to be opened, */
  DidNotOpen = 'deny'
}
