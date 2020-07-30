const { FFMPEG } = require('../ffmpeg');
const CameraSource = require('../CameraSource');

module.exports = function (accessory) {
  const platform = this;
  const {
    UUIDGen, Accessory, Service, Characteristic, Categories, hap,
  } = platform;

  if (!(platform.config.videoDoorbell || platform.config.raspberryPiCamera) || accessory.videoDoorbell) {
    return;
  }

  const videoDoorbellName = `${accessory.displayName} Camera`;
  const uuid = UUIDGen.generate(videoDoorbellName);
  const videodoorbellAccessory = new Accessory(videoDoorbellName, uuid, Categories.VIDEO_DOORBELL);

  const primaryService = new Service.Doorbell(videoDoorbellName);
  primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).on('get', (callback) => {
    // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
    callback(null, 0);
  });

  // Setup and configure the camera service
  let videoDoorbellSource = null;
  if (platform.config.raspberryPiCamera) {
    videoDoorbellSource = new CameraSource(hap, platform.config.video);
  } else {
    videoDoorbellSource = new FFMPEG(hap, {
      videoConfig: {
        source: platform.config.video.stream.replace('<your-url>', ''),
        stillImageSource: (platform.config.video.snapshotImage.startsWith('http') ? '-i ' : '') + platform.config.video.snapshotImage,
        maxWidth: platform.config.video.maxWidth,
        maxHeight: platform.config.video.maxHeight,
        maxFPS: platform.config.video.maxFPS,
        vcodec: platform.config.video.vcodec,
      },
    }, platform.log, 'ffmpeg');
  }

  videodoorbellAccessory.configureCameraSource(videoDoorbellSource);

  // Setup HomeKit doorbell service
  videodoorbellAccessory.addService(primaryService);

  videodoorbellAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'nello.io')
    .setCharacteristic(Characteristic.Model, 'Nello One')
    .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  // Identify
  videodoorbellAccessory.on('identify', (a, callback) => {
    // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
    callback();
  });

  accessory.videoDoorbell = primaryService;
  platform.api.publishCameraAccessories(platform, [videodoorbellAccessory]);
};
