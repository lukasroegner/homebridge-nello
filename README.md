# homebridge-nello

This project is a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as lock accessories. If you want to learn more about the smart intercom nello one, please visit https://www.nello.io. There is an excellent blog post about the integration of nello into homebridge that can be found at https://www.nello.io/blog/how-to-connect-your-nello-one-to-homebridge/.

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

Due to HomeKit limitations it's required to add the camera separately. Just tap on the plus button in the top right corner, choose "Add Accessory" and click on "Don't Have a Code or Can't Scan?". In the next view you should see the camera accessory. Tap it in order to add it to the Home app. The PIN is the same as of your HomeBridge instance.

## Retrieving a client ID and client secret from Nello

**IMPORTANT:** Please visit https://auth.nello.io/admin/ and sign in with your username and password that you also use in the nello.io app.

Fill in all required fields in the "Create API client" form (mark all "Allowed response type"s and "Allowed grant type"s). Copy the client ID and paste it into the configuration as seen below.

If you are using a dedicated user account for this plugin, make sure that you use the credentials of this account to generate a client ID.

## Configuration

> TODO link to config.ts/defaults

There are multiple ways to get notifications if someone rings at your door:

### Default configuration (with a motion sensor for ring notifications)

If you don't want to use a camera or don't have one this is the configuration for you.

```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "authType": "client",
            "clientSecret": "<paste-client-secret-here>",
            "clientId": "<paste-client-id-here>",
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

### FFMPEG Stream (from a srtp source)

If you have a doorbell with srtp support you can use this configuration.

**You need to install ffmpeg if you want to see a picture in the Home app. Just take a look at last paragraph of the Installation part.**

```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "authType": "client",
            "clientId": "<paste-client-id-here>",
            "clientSecret": "<paste-client-secret-here>",
            "lockTimeout": 5000,
            "locationUpdateInterval": 3600000,
            "exposeReachability": true,
            "motionSensor": false,
            "motionTimeout": 5000,
            "alwaysOpenSwitch": false,
            "videoDoorbell": true,
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

**Troubleshooting Guide for the video configuration:**

* Make sure that you either use FFmpeg command line arguments for the `snapshotImage` property (e.g. `-i ...`) or provide a URL. If you use an https:// address, make sure that you compiled FFmpeg with openssl (which is not the case when you followed the installtion instructions for Raspberry PI from https://github.com/KhaosT/homebridge-camera-ffmpeg).
* If you want to use a local image for the `snapshotImage` property, please set the property to `-i <absolute-path-to-your-image>`. Don't use `~`, use an absolute path and start your path with `/`.
* We included a nice static image, which you can use. Therefore, set the `snapshotImage` property to `-i <absolute-path-to-your-global-node-modules>/homebridge-nello/assets/nello.png`. The path to your global node modules varies based on the OS and the installation method. On a Raspberry PI, it is usually in `/opt/node/lib/node_modules`.
* If you want to use a static image for a fake video stream, set the `stream` property to `-re -loop 1 -i <absolute-path-to-your-image>`
* If you still have troubles configuring the camera, feel free to create issues. Please provide your configuration.

### Raspberry Pi Camera Module V2.1

If you're using a Raspberry Pi for HomeBridge and have a connected Camera Module, you can use this camera for notifications.

**You need to install ffmpeg if you want to see a picture in the Home app. Just take a look at last paragraph of the Installation part.**

```json
{
    "platforms": [
        {
            "platform" : "NelloPlatform",
            "name" : "nello.io",
            "authType": "client",
            "clientId": "<paste-client-id-here>",
            "clientSecret": "<paste-client-secret-here>",
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

## Development

### Linting

`npm run lint` / `npm run format`

### Publishing

* To bump the version automatically, go to the [`bump-version`](https://github.com/lukasroegner/homebridge-nello/actions?query=workflow%3Abump-version) workflow and trigger a new event by clicking `Run workflow`. You can enter `major` `minor` `patch` or an actual version like `v0.0.1`. This bumps the `package.json` version, creates a tag, and pushes it back to master. It also drafts a release for you. (Source: [bump-version.yml](./.github/workflows/bump-version.yml)).
* Now go to [Releases](https://github.com/lukasroegner/homebridge-nello/releases) where you will see a release already drafted for you. When you publish it, the `npm-publish` workflow will automatically run and publish to NPM. (Source: [npm-publish.yml](./.github/workflows/npm-publish.yml)).

(Requires GitHub Action `NPM_TOKEN` secret to be set in the repo with publish rights).
