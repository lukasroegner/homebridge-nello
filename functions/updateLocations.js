const request = require('request');

module.exports = function (retry, callback) {
  const platform = this;

  // Checks if the user is signed in
  platform.log('Getting locations from nello.io.');
  if (!platform.token) {
    return platform.signIn((result) => {
      if (result) {
        return platform.updateLocations(true, callback);
      }
      platform.updateReachability();
      return callback(false);
    });
  }

  // Sends a request to the API to get all locations of the user
  request({
    uri: `${platform.config.apiUri}/locations/`,
    method: 'GET',
    headers: {
      Authorization: `${platform.token.token_type} ${platform.token.access_token}`,
    },
    json: true,
  }, (error, response, body) => {
    // Checks if the API returned a positive result
    if (error || response.statusCode != 200 || !body || !body.data) {
      if (error) {
        platform.log(`Getting locations from nello.io failed. Error: ${error}`);
      } else if (response.statusCode != 200) {
        platform.log(`Getting locations from nello.io failed. Status Code: ${response.statusCode}`);
      } else if (!body || !body.data) {
        platform.log(`Getting locations from nello.io failed. Could not get locations from response: ${JSON.stringify(body)}`);
      }
      platform.signOut();

      if (retry) {
        platform.log('Retry signing in and getting locations again.');
        return platform.updateLocations(false, callback);
      }

      platform.updateReachability();
      return callback(false);
    }

    // Stores the location information
    platform.locations = body.data;

    // Cycles through all existing homebridge accessory to remove the ones that do not exist in nello.io
    for (var i = 0; i < platform.accessories.length; i++) {
      // Checks if the location exists
      let locationExists = false;
      for (var j = 0; j < platform.locations.length; j++) {
        if (platform.locations[j].location_id == platform.accessories[i].context.locationId) {
          locationExists = true;
        }
      }

      // Removes the accessory
      if (!locationExists) {
        platform.removeAccessory(platform.locations[j].location_id);
      }
    }

    // Cycles through all locations to add new accessories
    for (var i = 0; i < platform.locations.length; i++) {
      // Checks if an accessory already exists
      let accessoryExists = false;
      for (var j = 0; j < platform.accessories.length; j++) {
        if (platform.accessories[j].context.locationId == platform.locations[i].location_id) {
          accessoryExists = true;
          platform.addCamera(platform.accessories[j]);
        }
      }

      // Creates the new accessory
      if (!accessoryExists) {
        platform.addAccessory(platform.locations[i].location_id);
      }
    }

    // Returns a positive result
    platform.updateReachability();
    platform.log('Got locations from nello.io.');
    return callback(true);
  });
};
