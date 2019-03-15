const request = require("request");

module.exports = function (callback) {
    const platform = this;

    // Validates the configuration
    if (!platform.config.authUri) {
        platform.log("No Authentication URI for nello.io provided.");
        return callback(false);
    }
    if (!platform.config.username) {
        platform.log("No username for nello.io provided. Please make sure to create a dedicated nello.io account for this homebridge plugin.");
        return callback(false);
    }
    if (!platform.config.password) {
        platform.log("No password for nello.io provided. Please make sure to create a dedicated nello.io account for this homebridge plugin.");
        return callback(false);
    }

    // Sends the login request to the API
    platform.log("Signing in.");
    platform.token = null;
    platform.locations = [];
    request({
        uri: platform.config.authUri + "/oauth/token/",
        method: "POST",
        json: true,
        form: {
            "client_id": platform.config.clientId,
            "username": platform.config.username,
            "password": platform.config.password,
            "grant_type": "password"
        }
    }, function (error, response, body) {

        // Checks if the API returned a positive result
        if (error || response.statusCode != 200 || !body || !body.access_token) {
            if (error) {
                platform.log("Error while signing in. Error: " + error);
            } else if (response.statusCode != 200) {
                platform.log("Error while signing in. Status Code: " + response.statusCode);
            } else if (!body || !body.access_token) {
                platform.log("Error while signing in. Could not get access token from response: " + JSON.stringify(body));
            }
            platform.signOut();
            return callback(false);
        }

        // Stores the token information
        platform.token = body;
        platform.log("Signed in.");
        return callback(true);
    });
};