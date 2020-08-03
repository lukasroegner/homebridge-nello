# homebridge-nello

This project is a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as lock accessories. If you want to learn more about the smart intercom nello one, please visit <https://www.nello.io>.

[Configuration / Docs](https://lukasroegner.github.io/homebridge-nello)

## Features

* Door Lock
* Motion Sensor
* Video Doorbell
* Configurable Switch to automatically open the door on ring

## Disclaimer

Nello went bankrupt and was bought by Sclak. The public API was down for a long time after the announcement in October 2019 (though the app worked intermittently), but is back online as of August 2020. This plugin may stop working at any time due to this uncertainty. (See: [#48](https://github.com/lukasroegner/homebridge-nello/issues/48))

## Migration Guide from 0.5.x to 1.x.x

Look here: [Release v1.0.0](https://github.com/lukasroegner/homebridge-nello/releases/tag/v1.0.0)

## Installation

It's recommended to create a new dedicated nello.io account in order to prevent duplicated notifications if you open the door over the Home app. It's also possible to use your own account with this plugin.

1. Install the plugin via npm:

    ```bash
    npm install homebridge-nello -g
    ```

2. Generate clientId & clientSecret

    **IMPORTANT:** Please visit <https://auth.nello.io/admin/> and sign in with your username and password that you also use in the nello.io app. If you are using a dedicated user account for this plugin, make sure that you use the credentials of this account to generate a client ID.

    Fill in all required fields in the "Create API client" form (mark all "Allowed response type"s and "Allowed grant type"s)

3. Add the basic configuration

    ```json
    {
      "platforms": [
        {
          "platform" : "NelloPlatform",
          "name" : "nello.io",
          "auth": {
            "clientSecret": "<paste-client-secret-here>",
            "clientId": "<paste-client-id-here>"
          }
        }
      ]
    }
    ```

4. This exposes ONLY the door lock. Look at the [docs](https://lukasroegner.github.io/homebridge-nello/modules/_config_.html) for more options to configure motion sensors, the video doorbell, a custom webhook server, automation helper switches, and configure reachability.

### Optional: Installation of FFMPEG

You can install the default package or compile it yourself if you have a special case to fit.

```bash
sudo apt-get install ffmpeg
```

General information about ffmpeg can be found here <https://github.com/KhaosT/homebridge-camera-ffmpeg/wiki>)

Due to HomeKit limitations it's required to add the camera separately. Just tap on the plus button in the top right corner, choose "Add Accessory" and click on "Don't Have a Code or Can't Scan?". In the next view you should see the camera accessory. Tap it in order to add it to the Home app. The PIN is the same as of your HomeBridge instance.

**You need to install ffmpeg if you want to see a picture in the Home app. Just take a look at last paragraph of the Installation part.**

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:

* Nello Authentication: Retrieves a token using the specified client ID & secret
* Nello Public API: see all methods in [APIClient](https://github.com/lukasroegner/homebridge-nello/blob/master/src/lib/APIClient.ts)

Others

* Video Doorbell - This plugin uses <https://github.com/KhaosT/homebridge-camera-ffmpeg> and <https://github.com/moritzmhmk/homebridge-camera-rpi> for implementation

## Security

* All requests to the nello.io are made over HTTPS.
* The client secret used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Please make sure that nobody can access this device within your local network without permission.
* In the Apple Home app, a lock can be easily unlocked with a single tap on the icon. Please be careful not to open the door unintentionally.
* The webhook uses a relay service which is hosted by @AlexanderBabel. You can find the source code of the service here: <https://github.com/AlexanderBabel/nello-backend>. You can override this and configure your own URL if you expose the right ports, look at the docs for more info.
* Since the Nello webhooks are not signed or authenticated (see [#43](https://github.com/lukasroegner/homebridge-nello/issues/43)), an attacker who discovers your webhook URL will be able to open your door with a simple payload if you enable the "always open switch". This is mitigated by the use of constantly changing unique URLs, but use this feature at your own risk!

## Development

### Linting

`npm run lint` / `npm run format`

### Publishing

* To bump the version and publish automatically, go to the [`bump-version`](https://github.com/lukasroegner/homebridge-nello/actions?query=workflow%3Abump-version) workflow and trigger a new event by clicking `Run workflow`. You can enter `major` `minor` `patch` or an actual version like `v0.0.1`. This bumps the `package.json` version, creates a tag, updates the docs, pushes it back to master, and publishes to npm. (Source: [bump-version.yml](./.github/workflows/bump-version.yml)).
* Now go to [Releases](https://github.com/lukasroegner/homebridge-nello/releases) where you will see a release already published for you. You should update the release notes here.

(Requires GitHub Action `NPM_TOKEN` secret to be set in the repo with publish rights).
