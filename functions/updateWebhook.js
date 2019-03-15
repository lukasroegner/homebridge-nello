const request = require("request");

module.exports = function (locationId, uri, retry, callback) {
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

    // Checks if the webhook URL is provided
    if (!uri) {
        return callback(false);
    }
    // Checks if the user is signed in 
    platform.log("Updating webhook for door with ID " + locationId + " to " + uri + ".");
    if (!platform.token) {
        return platform.signIn(function (result) {
            if (result) {
                return platform.updateWebhook(locationId, uri, true, callback);
            } else {
                platform.updateReachability();
                return callback(false);
            }
        });
    }

    // Sends a request to the API to update the webhook
    request({
        uri: platform.config.apiUri + "/locations/" + locationId + "/webhook/",
        method: "PUT",
        headers: {
            "Authorization": platform.token.token_type + " " + platform.token.access_token
        },
        json: {
            "url": uri,
            "actions": [
                "swipe",
                "geo",
                "tw",
                "deny"
            ]
        }
    }, function (error, response, body) {

        // Checks if the API returned a positive result
        if (error || response.statusCode != 200) {
            if (error) {
                platform.log("Updating webhook failed. Error: " + error);
            } else if (response.statusCode != 200) {
                platform.log("Updating webhook failed. Status Code: " + response.statusCode);
            }
            platform.signOut();

            if (retry) {
                platform.log("Retry signing in and updating webhook again.");
                return platform.updateWebhook(locationId, uri, false, callback);
            }

            platform.updateReachability();
            return callback(false);
        }

        // Returns a positive result
        platform.updateReachability();
        platform.log("Updated webhook for door with ID " + locationId + " to " + uri + ".");
        return callback(true);
    });
}