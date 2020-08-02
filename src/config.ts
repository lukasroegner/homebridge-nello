import path from 'path';

import type { PluginIdentifier, PlatformName } from 'homebridge';

import type { ResolvedConfig } from './lib/resolveConfig';

export const PLUGIN_NAME: PluginIdentifier = 'homebridge-nello';
export const PLATFORM_NAME: PlatformName = 'NelloPlatform';

export const PUBLIC_API_URI = 'https://public-api.nello.io/v1';
export const AUTH_URI = 'https://auth.nello.io';

export const SOCKET_BACKEND = 'https://nello-socket.alexdev.de';

export type Config = {
  auth: NelloAuthConfig;
  common: NelloPlatformConfig;
  /**
   * If you have a doorbell with srtp support, or a Raspberry Pi camera module,
   * you can use this configuration.

   * You need to install ffmpeg if you want to see a picture in the Home app.
   * Just take a look at last paragraph of the Installation part
   * */
  video: NelloVideoConfig;
};

export const DEFAULT_CONFIG: ResolvedConfig = {
  common: {
    lockTimeout: 5000,
    motionTimeout: 5000,
    locationUpdateInterval: 3600000,
    exposeReachability: false,
    videoDoorbell: false,
    raspberryPiCamera: false,
    motionSensor: false,
    alwaysOpenSwitch: false,
    publicWebhookUrl: '',
    webhookServerPort: 5000,
    dryRun: false,
  },
  video: {
    stream: `-re -loop 1 -i ${path.resolve(__dirname, '../assets/nello.png')}`,
    snapshotImage: `-i ${path.resolve(__dirname, '../assets/nello.png')}`,
    maxWidth: 1280,
    maxHeight: 720,
    maxFPS: 30,
    vcodec: 'h264_omx',
    rotate: 0,
    debug: false,
    verticalFlip: false,
    horizontalFlip: false,
    ffmpegBinary: 'ffmpeg',
  },
};

export type NelloAuthConfig = {
  clientId: string
  clientSecret: string
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
   * Expose a switch to HomeKit. If the switch is enabled through HomeKit,
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
   * Port to run the Express Webhook server on. Only relevant if you setup the
   * publicWebhookUrl above.
   * */
  webhookServerPort?: number

  /** It's recommended to create another account in the nello app for this plugin.
   * In order to prevent duplicated notification you should enter the user name of
   * this HomeKit account. Default value is undefined. */
  homekitUser?: string

  /** Do not actually open the door, only log. Useful for testing. */
  dryRun?: boolean
};

export type NelloVideoConfig = {
  /**
   * Enter a stream url of e.g. your RaspberryPi camera or leave it blank
   * if you don't have one */
  stream?: string
  /**
   * Set to either a URL or '-i <absolute-path-to-custom-local-image>'
   *
   * The path MUST start with `/` and not `~` or be any other relative path
   * If you use an https:// address, make sure that ffmpeg is compiled with openssl
   */
  snapshotImage?: string
  /** Maximum width of the stream */
  maxWidth?: number
  /** Maximum height of the stream */
  maxHeight?: number
  /** Maximum frame per seconds of the stream */
  maxFPS?: number
  /** Set a video codec for ffmpeg */
  vcodec?: string
  /** Custom path to ffmpeg binary */
  ffmpegBinary?: string

  // The following settings are only available if raspberryPiConfig is set to true

  /** (Pi Only) If set to true you will see all messages from ffmpeg */
  rotate?: number
  /** (Pi Only) Rotate the video stream (in degrees) */
  debug?: boolean
  /** (Pi Only) Flip the stream vertically */
  verticalFlip?: boolean
  /** (Pi Only) Flip the stream horitzontally */
  horizontalFlip?: boolean
};
