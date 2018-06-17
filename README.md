# homebridge-nello

This project contains a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as accessories with the LockMechanism service.

## Installation

It's recommended to create a new dedicated nello.io account in order to prevent doubled notification if you open the door over HomeKit. It's also possible to use your own account with this plugin.

Install the plugin via npm:

```bash
npm install homebridge-nello -g
```

You need to install ffmpeg in order to see the unlock button in the notification.
```bash
sudo apt-get install ffmpeg
```
General information about ffmpeg can be found here https://github.com/KhaosT/homebridge-camera-ffmpeg/wiki)

When you want to use the video doorbell service you must add a camera accessory over the "Add Accessory" menu and enter the same code you have defined for your Homebridge.

Add the configuration to your config.json file:

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
            "doorbell": false,
            "videoDoorbell": false,
            "video": {
                "stream": "-re -i <your-url>",
                "snapshotImage": "http://via.placeholder.com/1280x720",
                "maxWidth": 1280,
                "maxHeight": 720,
                "maxFPS": 30
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

**doorbell** (optional): If this value is set to true, a camera can be added to HomeKit (as extra accessory) and when someone rings at your door you will get a push notification. Default set to false.

**videoDoorbell** (optional): If this value is set to true, a camera can be added to HomeKit (as extra accessory) and when someone rings at your door you will get a push notification with unlock button (The lock and the camera must be in the same room to see the unlock button). Default set to false.

**video Config** (optional): Over this part you can configure a camera for HomeKit.

**video.stream** (optional): Enter a stream url of e.g. your RaspberryPi camera or leave it blank if you don't have one.

**video.snapshotImage** (optional): You can set an image which will be shown as camera output. Default set to a placeholder image.

**video.maxWidth** (optional): Maximum width of the stream. Default set 1280px.

**video.maxHeight** (optional): Maximum height of the stream. Default set 720px.

**video.maxFPS** (optional): Maximum frame per seconds of the stream. Default set 30 FPS.

**homekitUser** (optional): It's recommended to create another account in the nello app for this plugin. In order to prevent duplicated notification you should enter the user name of this HomeKit account. Default value is undefined.

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:
* Nello Authentication: logs the user with the specified username and password in
* Nello Public API - /locations: Retrieves all locations of the user, which means all nello.io locks that are also visible to the account in the mobile app
* Nello Public API - /locations/{locationId}/open: Opens the lock with the specified locationId and the user that is logged in
* Video Doorbell - This plugin uses https://github.com/KhaosT/homebridge-camera-ffmpeg for implementation 

## Security

* All calls to the nello.io API are being sent via HTTPS. 
* The password of the user account that is used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Therefore, please make sure that nobody can access this device within your local network without permission. 
* In the Apple Home app, a lock can be easily unlocked with a single touch onto the icon. Please be careful not to open the door unintentionally.
* The webhook uses a relay service which is hosted by @us09alex. You can find the source code of the service here: https://github.com/us09alex/nello-backend

## Upcoming Features

The following features will be implemented soon, stay tuned!
Important: All new features will be added to the configuration, so that you can enable and disable all of them (if you don't like a feature).

* Any suggestions?
