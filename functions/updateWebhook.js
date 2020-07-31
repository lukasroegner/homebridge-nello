const request = require('request');

module.exports = function updateWebhook(locationId, uri, retry, callback) {
  const platform = this;

  // Checks if the location still exists
  if (!platform.locations.some((loc) => loc.location_id === locationId)) {
    callback(false);
    return;
  }

  // Checks if the webhook URL is provided
  if (!uri) {
    callback(false);
    return;
  }

  // Checks if the user is signed in
  platform.log(`Updating webhook for door with ID ${locationId} to ${uri}.`);

  if (!platform.token) {
    platform.signIn((result) => {
      if (result) {
        platform.updateWebhook(locationId, uri, true, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    });
    return;
  }

  // Sends a request to the API to update the webhook
  request({
    uri: `${platform.config.apiUri}/locations/${locationId}/webhook/`,
    method: 'PUT',
    headers: {
      Authorization: `${platform.token.token_type} ${platform.token.access_token}`,
    },
    json: {
      url: uri,
      actions: [
        'swipe',
        'geo',
        'tw',
        'deny',
      ],
    },
  }, (error, response) => {
    // Checks if the API returned a positive result
    if (error || response.statusCode !== 200) {
      if (error) {
        platform.log(`Updating webhook failed. Error: ${error}`);
      } else if (response.statusCode !== 200) {
        platform.log(`Updating webhook failed. Status Code: ${response.statusCode}`);
      }
      platform.signOut();

      if (retry) {
        platform.log('Retry signing in and updating webhook again.');
        platform.updateWebhook(locationId, uri, false, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    } else {
      // Returns a positive result
      platform.updateReachability();
      platform.log(`Updated webhook for door with ID ${locationId} to ${uri}.`);
      callback(true);
    }
  });
};
