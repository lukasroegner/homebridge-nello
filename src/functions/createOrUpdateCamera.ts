import type { CharacteristicGetCallback } from 'homebridge';

import type { NelloPlatform, AccessoryWithContext } from '../NelloPlatform';
import { PLUGIN_NAME } from '../config';
import { Location } from '../lib/Location';
import { getAccessoryService } from '../lib/getAccessoryService';
import { Camera } from '../video/Camera';
import { FFMPEG } from '../video/ffmpeg';

export const createOrUpdateCamera = (
  platform: NelloPlatform,
  location: Location,
  accessory: AccessoryWithContext,
): void => {
  const {
    uuid: UUIDGen, Service, Characteristic, Categories,
  } = platform.api.hap;
  const PlatformAccessoryCtr = platform.api.platformAccessory;

  const videoDoorbellName = `${accessory.displayName} Camera`;
  const uuid = UUIDGen.generate(videoDoorbellName);

  const videoDoorbellAccessory = new PlatformAccessoryCtr(
    videoDoorbellName,
    uuid,
    Categories.VIDEO_DOORBELL,
  );

  const primaryService = new Service.Doorbell(videoDoorbellName);

  primaryService
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .on('get', (callback: CharacteristicGetCallback) => {
      // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
      callback(null, 0);
    });

  // Setup and configure the camera service
  const videoDoorbellSource = (
    platform.config.common.raspberryPiCamera
      ? new Camera(platform.api.hap, platform.config.video)
      : new FFMPEG(platform.api.hap, {
        videoConfig: {
          source: platform.config.video.stream,
          stillImageSource: `${
            platform.config.video.snapshotImage.startsWith('http') ? '-i ' : ''
          }${
            platform.config.video.snapshotImage
          }`,
          maxWidth: platform.config.video.maxWidth,
          maxHeight: platform.config.video.maxHeight,
          maxFPS: platform.config.video.maxFPS,
          vcodec: platform.config.video.vcodec,
        },
      }, platform.log, platform.config.video.ffmpegBinary)
  );

  videoDoorbellAccessory.configureCameraSource(videoDoorbellSource);
  videoDoorbellAccessory.addService(primaryService);

  getAccessoryService(videoDoorbellAccessory, Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'nello.io')
    .setCharacteristic(Characteristic.Model, 'Nello One')
    .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  platform.addVideoDoorbell(location, videoDoorbellAccessory);
  platform.api.publishCameraAccessories(PLUGIN_NAME, [videoDoorbellAccessory]);
};
