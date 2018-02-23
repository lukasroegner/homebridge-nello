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
            "lockTimeout": 5000
        }
    ]
}
```

**username**: the email address of your nello.io account

**password**: the password of your account

**lockTimeout** (optional): timeout in milliseconds, after which the lock will be displayed as locked after you unlock the door. Default value is 5000.

## Implementation Details

This plugin uses the HTTP API of nello.io for the following features:
* /login: logs the user with the specified username and password in, i.e. creates a new session
* /locations: Retrieves all locations of the user, which means all nello.io locks that are also visible to the account in the mobile app
* /locations/{locationId}/users/{userId}/open: Opens the lock with the specified locationId and the user that is logged in

## Security

* All calls to the nello.io API are being sent via HTTPS. 
* The password of the user account that is used by this plugin has to be specified in the `config.json` on the PC/Mac/Raspberry running homebridge. Therefore, please make sure that nobody can access this device within your local network without permission. 
* In the Apple Home app, a lock can be easily unlocked with a single touch onto the icon. Please be careful not to open the door unintentionally. Some homebrige plugins contain an additional switch for "enabling" the actual lock. I would not use this feature, but feel free to request it, I'll implement it for you.