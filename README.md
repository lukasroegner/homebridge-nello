# homebridge-nello

This project contains a homebridge plugin for the smart intercom nello.io. All your nello.io locks are dynamically added to HomeKit as accessories with the LockMechanism service.

## Installation

1. Create a new dedicated nello.io Account with admin rights that homebridge uses to communicate with the nello.io API. 
Don't use your nellio.io account which you use with your phone, otherwise you will be logged out each time homebridge communicates with the API.

2. Install the plugin via npm:

npm install homebridge-nello -g

3. Add the configuration to your config.json file:

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

username: the email address of your nello.io account
password: the password of your account
lockTimeout (optional): timeout in milliseconds, after which the lock will be displayed as locked after you unlock the door. Default value is 5000.

4. Start homebridge
