const request = require('request');

module.exports = function open(locationId, retry, callback) {
  const platform = this;

  // Checks if the location still exists
  if (!platform.locations.some((location) => location.location_id === locationId)) {
    callback(false);
    return;
  }

  // Checks if the user is signed in
  platform.log(`Opening door at location with ID ${locationId}.`);
  if (!platform.token) {
    platform.signIn((result) => {
      if (result) {
        platform.open(locationId, true, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    });
    return;
  }

  // Gets the corresponding accessory
  const accessory = platform.accessories.find((acc) => acc.context.locationId === locationId);

  if (!accessory) {
    platform.log(`Opening door at location with ID ${locationId} failed. The lock is not available anymore.`);
    callback(false);
    return;
  }

  // Sends the request to open the lock
  request({
    uri: `${platform.config.apiUri}/locations/${locationId}/open/`,
    method: 'PUT',
    headers: {
      Authorization: `${platform.token.token_type} ${platform.token.access_token}`,
    },
    json: true,
  }, (error, response) => {
    // Checks if the API returned a positive result
    if (error || response.statusCode !== 200) {
      if (error) {
        platform.log(`Opening door at location with ID ${locationId} failed. Error: ${error}`);
      } else if (response.statusCode !== 200) {
        platform.log(`Opening door at location with ID ${locationId} failed. Status Code: ${response.statusCode}`);
      }

      platform.signOut();

      if (retry) {
        platform.log('Retry signing in and opening the door again.');
        platform.open(locationId, false, callback);
        return;
      }

      platform.updateReachability();
      callback(false);
      return;
    }

    // Returns the positive result
    platform.updateReachability();
    platform.log(`Opened door at location with ID ${locationId}.`);

    callback(true);
  });
};
