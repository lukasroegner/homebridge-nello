# homebridge-nello

This project contains a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as accessories with the LockMechanism service.

## Installation

You can create a new dedicated nello.io account so that your personal name is not shown in the nello activity log for actions that HomeKit executes. However, you can also use your own credentials for the plugin.

Install the plugin via npm:

```bash
npm install homebridge-nello -g
```

If you want to see a snapshot image for the video doorbell service please install ffmpeg (See here: https://github.com/KhaosT/homebridge-camera-ffmpeg/wiki)

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
            "webhookLocalPort": 11937,
            "webhookRetryInterval":10000,
            "videoDoorbell": true,
            "snapshotImage": "http://via.placeholder.com/1280x720"
        }
    ]
}
```

**username**: the email address of your nello.io account

**password**: the password of your account

**lockTimeout** (optional): timeout in milliseconds, after which the lock will be displayed as locked after you unlock the door. Default value is 5000.

**locationUpdateInterval** (optional): interval in milliseconds, in which the locks of a user are updated (i.e. new locks are added as accessories, locks that are no longer under control of the user are removed). This interval is also used to update the reachability of the locks (if the nello API is not reachable the locks are marked as "not rechable"). Default value is every hour (3600 * 1000). Use 0 to disable continuous updates.

**exposeReachability** (optional): If this value is set to true, the state of the locks is changed to "unknown" if the nello.io API is not reachable. It might be annoying to get HomeKit notifications that "the door is unlocked" (which is the content of the notification, even if the state of the door is "jammed" or "unknown").

**webhookLocalPort** (optional): Port of the webhook for nello events. Default set to 11937.

**webhookRetryInterval** (optional): This interval defines the timeout before the next try to register the webhook if the first time fails. Default set to 10 seconds.

**videoDoorbell** (optional): If this value is set to true, a camera can be added to HomeKit (as extra accessory) and when someone rings at your door you will get a push notification with unlock button (The lock and the camera must be in the same room the see the unlock button). Default set to true.

**snapshotImage** (optional): You can set an image which will be shown as camera output. Default set to a placeholder image.

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:
* Nello Authentication: logs the user with the specified username and password in
* Nello Public API - /locations: Retrieves all locations of the user, which means all nello.io locks that are also visible to the account in the mobile app
* Nello Public API - /locations/{locationId}/open: Opens the lock with the specified locationId and the user that is logged in
* Video Doorbell - I used https://github.com/KhaosT/homebridge-camera-ffmpeg for implementation 

## Security

* All calls to the nello.io API are being sent via HTTPS. 
* The password of the user account that is used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Therefore, please make sure that nobody can access this device within your local network without permission. 
* In the Apple Home app, a lock can be easily unlocked with a single touch onto the icon. Please be careful not to open the door unintentionally.

## Upcoming Features

The following features will be implemented soon, stay tuned!
Important: I'll add all of the new features to the configuration, so that you can enable and disable all of them (if you don't like a feature).

* Doorbell Service: I'll implement the doorbell service, so that you get notifications when someone rings the bell.
