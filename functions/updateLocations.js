const request = require('request');

module.exports = function updateLocations(retry, callback) {
  const platform = this;

  // Checks if the user is signed in
  platform.log('Getting locations from nello.io.');
  if (!platform.token) {
    platform.signIn((result) => {
      if (result) {
        platform.updateLocations(true, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    });
    return;
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
    if (error || response.statusCode !== 200 || !body || !body.data) {
      if (error) {
        platform.log(`Getting locations from nello.io failed. Error: ${error}`);
      } else if (response.statusCode !== 200) {
        platform.log(`Getting locations from nello.io failed. Status Code: ${response.statusCode}`);
      } else if (!body || !body.data) {
        platform.log(`Getting locations from nello.io failed. Could not get locations from response: ${JSON.stringify(body)}`);
      }
      platform.signOut();

      if (retry) {
        platform.log('Retry signing in and getting locations again.');
        platform.updateLocations(false, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }

      return;
    }

    // Stores the location information
    platform.locations = body.data;

    // Cycles through all existing homebridge accessory to remove
    // the ones that do not exist in nello.io
    platform.accessories.forEach((accessory) => {
      const locationExists = platform.locations.some(
        (loc) => loc.location_id === accessory.context.locationId,
      );

      if (!locationExists) {
        platform.removeAccessory(accessory.context.locationId);
      }
    });

    // Cycles through all locations to add new accessories
    platform.locations.forEach((location) => {
      const accessories = platform.accessories.filter(
        (accessory) => accessory.context.locationId === location.location_id,
      );

      const accessoryExists = accessories.length > 0;

      accessories.forEach((accessory) => {
        platform.addCamera(accessory);
      });

      if (!accessoryExists) {
        platform.addAccessory(location.location_id);
      }
    });

    // Returns a positive result
    platform.updateReachability();
    platform.log('Got locations from nello.io.');

    callback(true);
  });
};
