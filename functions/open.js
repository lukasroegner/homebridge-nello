const request = require("request");

module.exports = function (locationId, retry, callback) {
    const platform = this;

    // Checks if the location still exists
    var locationExists = false;
    for (var i = 0; i < platform.locations.length; i++) {
        if (platform.locations[i].location_id == locationId) {
            locationExists = true;
        }
    }
    if (!locationExists) {
        return callback(false);
    }

    // Checks if the user is signed in 
    platform.log("Opening door at location with ID " + locationId + ".");
    if (!platform.token) {
        return platform.signIn(function (result) {
            if (result) {
                return platform.open(locationId, true, callback);
            } else {
                platform.updateReachability();
                return callback(false);
            }
        });
    }

    // Gets the corresponding accessory
    var accessory = null;
    for (var i = 0; i < platform.accessories.length; i++) {
        if (platform.accessories[i].context.locationId == locationId) {
            accessory = platform.accessories[i];
        }
    }
    if (!accessory) {
        platform.log("Opening door at location with ID " + locationId + " failed. The lock is not available anymore.");
        return callback(false);
    }

    // Sends the request to open the lock
    request({
        uri: platform.config.apiUri + "/locations/" + locationId + "/open/",
        method: "PUT",
        headers: {
            "Authorization": platform.token.token_type + " " + platform.token.access_token
        },
        json: true
    }, function (error, response, body) {

        // Checks if the API returned a positive result
        if (error || response.statusCode != 200) {
            if (error) {
                platform.log("Opening door at location with ID " + locationId + " failed. Error: " + error);
            }
            if (response.statusCode != 200) {
                platform.log("Opening door at location with ID " + locationId + " failed. Status Code: " + response.statusCode);
            }
            platform.signOut();

            if (retry) {
                platform.log("Retry signing in and opening the door again.");
                return platform.open(locationId, false, callback);
            }

            platform.updateReachability();
            return callback(false);
        }

        // Returns the positive result
        platform.updateReachability();
        platform.log("Opened door at location with ID " + locationId + ".");
        return callback(true);
    });
}