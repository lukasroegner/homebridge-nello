import type { PluginIdentifier, PlatformName } from 'homebridge';

export const PLUGIN_NAME: PluginIdentifier = 'homebridge-nello';
export const PLATFORM_NAME: PlatformName = 'NelloPlatform';

export const PUBLIC_API_URI = 'https://public-api.nello.io/v1';
export const AUTH_URI = 'https://auth.nello.io';

export const SOCKET_BACKEND = 'https://nello-socket.alexdev.de';

export type NelloAuthConfig = {
  /**
   * the method of authentication, either "password" or "client". This is set to "password"
   * for backwards compatibility with previous versions of this plugin, but it is recommended
   * to use the "client" method to avoid having to keep a username and password in plaintext
   * in the configuration
   */
  authType?: 'password' | 'client'
  /** Client ID (read "Retrieving a client ID and client secret from Nello") */
  clientId?: string
  /** (required for "client" auth) */
  clientSecret?: string
  /** (required for "password" auth): the email address of your nello.io account. */
  username?: string
  /** (required for "password" auth): the password of your account. */
  password?: string
};

export type NelloPlatformConfig = {
  /** timeout in milliseconds, after which the lock will be displayed as locked after you
   * unlock the door */
  lockTimeout?: number
  /**
   * timeout in milliseconds, after which the motion sensor will be displayed as clear
   * after some rang
   */
  motionTimeout?: number

  /**
   * interval in milliseconds, in which the locks of a user are updated (i.e. new locks are
   * added as accessories, locks that are no longer under control of the user are removed).
   * This interval is also used to update the reachability of the locks (if the nello API is
   * not reachable the locks are marked as "not rechable").
   * Use 0 to disable continuous updates.
   */
  locationUpdateInterval?: number

  /**
   * If this value is set to true, the state of the locks is changed to "unknown" if the
   * nello.io API is not reachable. It might be annoying to get HomeKit notifications that
   * "the door is unlocked" (which is the content of the notification, even if the state of
   * the door is "jammed" or "unknown") */
  exposeReachability?: boolean

  /**
   * If this value is set to true, a camera can be added to HomeKit (as extra accessory)
   * and when someone rings at your door you will get a push notification with unlock button
   * (The lock and the camera must be in the same room to see the unlock button)
   * */
  videoDoorbell?: boolean
  /** Use a video configuration adjusted for the camera module. */
  raspberryPiCamera?: boolean

  /**
   * Expose a motion sensor to HomeKit and trigger it every time someone rings.
   * (Can be used for HomeKit automations and notifications.)
   * */
  motionSensor?: boolean
  /**
   * Exposed a switch to HomeKit. If the switch is enabled through HomeKit,
   * every time someone rings and Nello will not open the door automatically,
   * this plugin will do it. (Can be used for HomeKit automations.)
   * */
  alwaysOpenSwitch?: boolean

  /** Specify this if you would not like to use the Webhook Relay service and instead
   * setup port forwarding and Dynamic DNS to make a local Express server publicly accessible.
   * Must be configured to the full URL (e.g. http://example.com:3000/ or https://example.com/)
   * to register with Nello.io. */
  publicWebhookUrl?: string
  /**
   * Port to run the Express Webhook server on. Only required if you setup the
   * publicWebhookUrl above.
   * */
  webhookServerPort?: number

  video?: {
    /**
     * Enter a stream url of e.g. your RaspberryPi camera or leave it blank
     * if you don't have one */
    stream?: string
    /** You can set an image which will be shown as camera output */
    snapshotImage?: string
    /** Maximum width of the stream */
    maxWidth?: number
    /** Maximum height of the stream */
    maxHeight?: number
    /** Maximum frame per seconds of the stream */
    maxFPS?: number
    /** Set a video codec for ffmpeg */
    vcodec?: string

    // The following settings are only available if raspberryPiConfig is set to true

    /** (Pi Only) If set to true you will see all messages from ffmpeg */
    rotate: number
    /** (Pi Only) Rotate the video stream (in degrees) */
    debug?: boolean
    /** (Pi Only) Flip the stream vertically */
    verticalFlip?: boolean
    /** (Pi Only) Flip the stream horitzontally */
    horizontalFlip?: boolean
  }

  /** It's recommended to create another account in the nello app for this plugin.
   * In order to prevent duplicated notification you should enter the user name of
   * this HomeKit account. Default value is undefined. */
  homekitUser?: string
};
