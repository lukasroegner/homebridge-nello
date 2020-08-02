import type { CharacteristicGetCallback } from 'homebridge';

import type { NelloPlatform, AccessoryWithContext } from '../NelloPlatform';
import { PLATFORM_NAME } from '../config';

import { getAccessoryService } from '../lib/getAccessoryService';

import { FFMPEG } from '../ffmpeg';
import CameraSource from '../CameraSource';

/**
 * Adds a camera accessory.
 */
export const addCamera = (platform: NelloPlatform, accessory: AccessoryWithContext): void => {
  const {
    uuid: UUIDGen, Service, Characteristic, Categories,
  } = platform.api.hap;
  const PlatformAccessoryCtr = platform.api.platformAccessory;

  if (
    !(platform.config.common.videoDoorbell || platform.config.common.raspberryPiCamera)
    || accessory.context.videoDoorbell
  ) {
    return;
  }

  const videoDoorbellName = `${accessory.displayName} Camera`;
  const uuid = UUIDGen.generate(videoDoorbellName);
  const videodoorbellAccessory = new PlatformAccessoryCtr(
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
      ? new CameraSource(platform.api.hap, platform.config.video)
      : new FFMPEG(platform.api.hap, {
        videoConfig: {
          source: platform.config.video.stream.replace('<your-url>', ''),
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
      }, platform.log, 'ffmpeg')
  );

  videodoorbellAccessory.configureCameraSource(videoDoorbellSource);

  // Setup HomeKit doorbell service
  videodoorbellAccessory.addService(primaryService);

  getAccessoryService(videodoorbellAccessory, Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'nello.io')
    .setCharacteristic(Characteristic.Model, 'Nello One')
    .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  // Identify
  videodoorbellAccessory.on('identify', () => {
    // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
  });

  accessory.context.videoDoorbell = videodoorbellAccessory;
  platform.api.publishExternalAccessories(PLATFORM_NAME, [videodoorbellAccessory]);
};
