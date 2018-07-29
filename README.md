# homebridge-nello

This project is a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as lock accessories.

## Installation

It's recommended to create a new dedicated nello.io account in order to prevent duplicated notifications if you open the door over the Home app. It's also possible to use your own account with this plugin.

Install the plugin via npm:

```bash
npm install homebridge-nello -g
```

### Optional: Installation of FFMPEG
**Only if you want to use a camera accessory. More information in the Configuration section.**
You can install the default package or compile it yourself if you have a special case to fit.
```bash
sudo apt-get install ffmpeg
```
General information about ffmpeg can be found here https://github.com/KhaosT/homebridge-camera-ffmpeg/wiki)

Due to HomeKit limitations it's requiered to add the camera separately. Just tap on the plus button in the top right corner, choose "Add Accessory" and click on "Don't Have a Code or Can't Scan?". In the next view you should see the camera accessory. Tap it in order to add it to the Home app. The PIN is the same as of your HomeBridge instance.

## Configuration
There are multiple ways to get notifications if someone rings at your door:

### Default configuration (with a motion sensor for ring notifications)
If you don't want to use a camera or don't have one this is the configuration for you.
```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "username": "<your-username>",
            "password": "<your-password>",
            "lockTimeout": 5000,
            "locationUpdateInterval": 3600000,
            "exposeReachability": true,
            "motionSensor": true,
            "motionTimeout": 5000,
            "alwaysOpenSwitch": false,
            "homekitUser": "Home Kit"
        }
    ]
}
```

### FFMPEG Stream (from a strp source)
If you have a doorbell with srtp support you can use this configuration.
**You need to install ffmpeg if you want to see a picture in the Home app. Just take a look at last paragraph of the Installation part.**
```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "username": "<your-username>",
            "password": "<your-password>",
            "lockTimeout": 5000,
            "locationUpdateInterval": 3600000,
            "exposeReachability": true,
            "motionSensor": false,
            "motionTimeout": 5000,
            "alwaysOpenSwitch": false,
            "videoDoorbell": false,
            "video": {
                "stream": "-re -i <your-url>",
                "snapshotImage": "http://via.placeholder.com/1280x720",
                "maxWidth": 1280,
                "maxHeight": 720,
                "maxFPS": 30,
                "vcodec": "h264_omx"
            },
            "homekitUser": "Home Kit"
        }
    ]
}
```

### Raspberry Pi Camera Module V2.1
If you're using a Raspberry Pi for HomeBridge and have a connected Camera Module, you can use this camera for notifications.
**You need to install ffmpeg if you want to see a picture in the Home app. Just take a look at last paragraph of the Installation part.**
```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "username": "<your-username>",
            "password": "<your-password>",
            "lockTimeout": 5000,
            "locationUpdateInterval": 3600000,
            "exposeReachability": true,
            "motionSensor": false,
            "motionTimeout": 5000,
            "alwaysOpenSwitch": false,
            "raspberryPiCamera": true,
            "video": {
                "debug": false,
                "rotate": 0,
                "verticalFlip": false,
                "horizontalFlip": false
            },
            "homekitUser": "Home Kit"
        }
    ]
}
```

**username**: the email address of your nello.io account

**password**: the password of your account

**lockTimeout** (optional): timeout in milliseconds, after which the lock will be displayed as locked after you unlock the door. Default value is 5000.

**locationUpdateInterval** (optional): interval in milliseconds, in which the locks of a user are updated (i.e. new locks are added as accessories, locks that are no longer under control of the user are removed). This interval is also used to update the reachability of the locks (if the nello API is not reachable the locks are marked as "not rechable"). Default value is every hour (3600 * 1000). Use 0 to disable continuous updates.

**exposeReachability** (optional): If this value is set to true, the state of the locks is changed to "unknown" if the nello.io API is not reachable. It might be annoying to get HomeKit notifications that "the door is unlocked" (which is the content of the notification, even if the state of the door is "jammed" or "unknown").

**motionSensor** (optional): If this value is set to true, a motion sensor will be exposed to HomeKit and trigger every time someone rings. (Can be used for HomeKit automations and notifications.)

**motionTimeout** (optional): timeout in milliseconds, after which the motion sensor will be displayed as clear after some rang. Default value is 5000.

**alwaysOpenSwitch** (optional): If this value is set to true, a switch will be exposed to HomeKit. If the switch is enabled through HomeKit, every time someone rings and Nello will not open the door automatically, this plugin will do it. (Can be used for HomeKit automations.)

**doorbell** (optional): **No longer available. Replaced with motionSensor**

**videoDoorbell** (optional): If this value is set to true, a camera can be added to HomeKit (as extra accessory) and when someone rings at your door you will get a push notification with unlock button (The lock and the camera must be in the same room to see the unlock button). Default set to false.

**raspberryPiCamera** (must be set to true if you want to use this feature): If set to true the plugin uses a video configuration adjusted for the camera module. Default: false

**video Config (FFMPEG)** (optional): Over this part you can configure a camera for HomeKit.

**video.stream** (optional): Enter a stream url of e.g. your RaspberryPi camera or leave it blank if you don't have one.

**video.snapshotImage** (optional): You can set an image which will be shown as camera output. Default set to a placeholder image.

**video.maxWidth** (optional): Maximum width of the stream. Default set 1280px.

**video.maxHeight** (optional): Maximum height of the stream. Default set 720px.

**video.maxFPS** (optional): Maximum frame per seconds of the stream. Default set 30 FPS.

**video.vcodec** (optional): Set a video codec for ffmpeg. Default set to h264_omx.

**video Config (Raspberry Pi Camera Module V2.1)**

**video.debug** (optional, only with raspberryPiCamera set to true): If set to true you will see all messages from ffmpeg.
**video.rotate** (optional, only with raspberryPiCamera set to true): Rotate the video stream (in degrees) Default: 0.

**video.verticalFlip** (optional, only with raspberryPiCamera set to true): Flip the stream vertically. Default: false.

**video.horizontalFlip** (optional, only with raspberryPiCamera set to true): Flip the stream horitzontally. Default: false.

**homekitUser** (optional): It's recommended to create another account in the nello app for this plugin. In order to prevent duplicated notification you should enter the user name of this HomeKit account. Default value is undefined.

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:
* Nello Authentication: logs the user with the specified username and password in
* Nello Public API - /locations: Retrieves all locations of the user, which means all nello.io locks that are also visible to the account in the mobile app
* Nello Public API - /locations/{locationId}/open: Opens the lock with the specified locationId and the user that is logged in
* Video Doorbell - This plugin uses https://github.com/KhaosT/homebridge-camera-ffmpeg and https://github.com/moritzmhmk/homebridge-camera-rpi for implementation

## Security

* All calls to the nello.io API are being sent via HTTPS. 
* The password of the user account that is used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Therefore, please make sure that nobody can access this device within your local network without permission. 
* In the Apple Home app, a lock can be easily unlocked with a single touch onto the icon. Please be careful not to open the door unintentionally.
* The webhook uses a relay service which is hosted by @AlexanderBabel. You can find the source code of the service here: https://github.com/AlexanderBabel/nello-backend

## Upcoming Features

* Any suggestions?
