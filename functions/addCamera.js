const { FFMPEG } = require('../ffmpeg');
const CameraSource = require('../CameraSource');

module.exports = function (accessory) {
    const platform = this;
    const { UUIDGen, Accessory, Service, Characteristic, Categories, hap } = platform;

    if (!(platform.config.videoDoorbell || platform.config.doorbell) || accessory.videoDoorbell) {
        return;
    }

    var videoDoorbellName = accessory.displayName + " Camera";
    var uuid = UUIDGen.generate(videoDoorbellName);
    var videodoorbellAccessory = new Accessory(videoDoorbellName, uuid, Categories.VIDEO_DOORBELL);

    var primaryService = new Service.Doorbell(videoDoorbellName);
    primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).on('get', function (callback) {
        // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
        callback(null, 0);
    });

    if (platform.config.videoDoorbell) {
        // Setup and configure the camera services
        var videoDoorbellSource = null;

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
                    vcodec: platform.config.video.vcodec
                }
            }, platform.log, 'ffmpeg');
        }

        videodoorbellAccessory.configureCameraSource(videoDoorbellSource);
    }

    // Setup HomeKit doorbell service
    videodoorbellAccessory.addService(primaryService);

    videodoorbellAccessory
        .getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "nello.io")
        .setCharacteristic(Characteristic.Model, "Nello One")
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

    // Identify
    videodoorbellAccessory.on('identify', function (a, callback) {
        // primaryService.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
        callback();
    });

    accessory.videoDoorbell = primaryService;
    platform.api.publishCameraAccessories(platform, [videodoorbellAccessory]);
}