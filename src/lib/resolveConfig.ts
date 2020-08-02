import {
  DEFAULT_CONFIG, Config, NelloPlatformConfig, NelloVideoConfig,
} from '../config';

/** mark all keys as required, but leave some as-is */
type RequiredExceptKeys<T, U extends keyof T> = T & Required<Omit<T, U>>;

// this guarantees that the resolveConfig checks and sets all the values
// and that the code itself has access to everything
export type ResolvedConfig = {
  // homekitUser is the one value that is allowed to be undefined after defaults are set
  common: RequiredExceptKeys<NelloPlatformConfig, 'homekitUser'>
  video: Required<NelloVideoConfig>
};

export const resolveConfig = (
  config: Partial<Config>,
  logError: (message: string) => void,
): ResolvedConfig | undefined => {
  if (!config) {
    logError('No config found');
    return undefined;
  }

  const { common, video } = config;
  const { common: defaultCommon, video: defaultVideo } = DEFAULT_CONFIG;

  if (!common) {
    logError('No common and/or video config provided. Did you remember to update your config file for v1?');
    return undefined;
  }

  return {
    common: {
      ...common,
      lockTimeout: common.lockTimeout ?? defaultCommon.lockTimeout,
      motionTimeout: common.motionTimeout ?? defaultCommon.motionTimeout,

      locationUpdateInterval: common.locationUpdateInterval === 0
        ? 0
        : (common.locationUpdateInterval ?? defaultCommon.locationUpdateInterval),

      exposeReachability: common.exposeReachability ?? defaultCommon.exposeReachability,

      videoDoorbell: common.videoDoorbell ?? defaultCommon.videoDoorbell,
      raspberryPiCamera: common.raspberryPiCamera ?? defaultCommon.raspberryPiCamera,

      motionSensor: common.motionSensor ?? defaultCommon.motionSensor,
      alwaysOpenSwitch: common.alwaysOpenSwitch ?? defaultCommon.alwaysOpenSwitch,

      publicWebhookUrl: common.publicWebhookUrl ?? defaultCommon.publicWebhookUrl,
      webhookServerPort: common.webhookServerPort ?? defaultCommon.webhookServerPort,
    },

    video: {
      ...video,
      stream: video?.stream ?? defaultVideo.stream,
      snapshotImage: video?.snapshotImage ?? defaultVideo.snapshotImage,
      maxWidth: video?.maxWidth ?? defaultVideo.maxWidth,
      maxHeight: video?.maxHeight ?? defaultVideo.maxHeight,
      maxFPS: video?.maxFPS ?? defaultVideo.maxFPS,
      vcodec: video?.vcodec ?? defaultVideo.vcodec,
      rotate: video?.rotate ?? defaultVideo.rotate,
      debug: video?.debug ?? defaultVideo.debug,
      verticalFlip: video?.verticalFlip ?? defaultVideo.verticalFlip,
      horizontalFlip: video?.horizontalFlip ?? defaultVideo.horizontalFlip,
      ffmpegBinary: video?.ffmpegBinary ?? defaultVideo.ffmpegBinary,
    },
  };
};
