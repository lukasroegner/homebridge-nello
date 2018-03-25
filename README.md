# homebridge-nello

This project contains a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as accessories with the LockMechanism service.

## Installation

Create a new dedicated nello.io Account with admin rights that homebridge uses to communicate with the nello.io API. 
Don't use your nellio.io account which you use with your phone, otherwise you will be logged out each time homebridge communicates with the API.

Install the plugin via npm:

```bash
npm install homebridge-nello -g
```

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
            "locationUpdateInterval": 60000,
            "activityUpdateInterval": 10000,
            "exposeReachability": false
        }
    ]
}
```

**username**: the email address of your nello.io account

**password**: the password of your account

**lockTimeout** (optional): timeout in milliseconds, after which the lock will be displayed as locked after you unlock the door. Default value is 5000.

**locationUpdateInterval** (optional): interval in milliseconds, in which the locks of a user are updated (i.e. new locks are added as accessories, locks that are no longer under control of the user are removed). This interval is also used to update the reachability of the locks (if the nello API is not reachable the locks are marked as "not rechable"). Default value is every minute (60000). Use 0 to disable continuous updates.

**activityUpdateInterval** (optional): interval in milliseconds, in which the activity of the locks of a user are updated (i.e. door has been opened by another user outside HomeKit). This interval is used to toggle the lock state in order to enable notifications in HomeKit. Is also used to update the reachability of the locks (if the nello API is not reachable the locks are marked as "not rechable"). Default value is every 10 seconds. Use 0 to disable continuous updates. **As soon as the public nello.io API is ready, this mechanism will be changed to an event-subscription-based model rather than polling.**

**exposeReachability** (optional): If this value is set to true, the state of the locks is changed to "unknown" if the nello.io API is not reachable. Default value is false, as currently API outages are common at nello.io. It might be annoying to get HomeKit notifications that "the door is unlocked" (which is the content of the notification, even if the state of the door is "jammed" or "unknown").

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:
* /login: logs the user with the specified username and password in, i.e. creates a new session
* /locations: Retrieves all locations of the user, which means all nello.io locks that are also visible to the account in the mobile app
* /locations/{locationId}/users/{userId}/open: Opens the lock with the specified locationId and the user that is logged in
* /locations/{locationId}/activity: Gets the activity at the location (i.e. door is unlocked, bell rings)

## Security

* All calls to the nello.io API are being sent via HTTPS. 
* The password of the user account that is used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Therefore, please make sure that nobody can access this device within your local network without permission. 
* In the Apple Home app, a lock can be easily unlocked with a single touch onto the icon. Please be careful not to open the door unintentionally.

## Upcoming Features

The following features will be implemented soon, stay tuned!
Important: I'll add all of the new features to the configuration, so that you can enable and disable all of them (if you don't like a feature).

* Doorbell Service: As soon as the public API is published by nello, I'll implement the doorbell service, so that you get notifications when someone rings the bell.
* Video Doorbell Service: When implementing the Video Doorbell Service, an "unlock" button appears in the notification, might be a nice feature.
