
var request = require("request");
var Accessory, Service, Characteristic, UUIDGen;

var pluginName = "homebridge-nello";
var platformName = "NelloPlatform";

/**
 * Defines the export of the platform module.
 * @param homebridge The homebridge object that contains all classes, objects and functions for communicating with HomeKit.
 */
module.exports = function(homebridge) {

  // Gets the classes required for implementation of the plugin
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  // Registers the dynamic nello platform, as the locks are read from the API and created dynamically
  homebridge.registerPlatform(pluginName, platformName, NelloPlatform, true);
}

/**
 * Initializes a new platform instance for the nello plugin.
 * @param log The logging function.
 * @param config The configuration that is passed to the plugin (from the config.json file).
 * @param api The API instance of homebridge (may be null on older homebridge versions).
 */
function NelloPlatform(log, config, api) {
  var platform = this;

  // Defines the variables that are used throughout the platform
  platform.log = log;
  platform.config = config;
  platform.user = null;
  platform.locations = [];
  platform.jar = null;
  platform.accessories = [];

  // Initializes the configuration
  platform.config.apiUri = "https://api.nello.io";
  platform.config.lockTimeout = platform.config.lockTimeout || 5000;
  platform.config.locationUpdateInterval = platform.config.locationUpdateInterval || 60000;
  platform.config.exposeReachability = platform.config.exposeReachability || false;

  // Checks whether the API object is available
  if (api) {

    // Saves the API object to register new locks later on
    log("Homebridge API available.");
    platform.api = api;

    // Subscribes to the event that is raised when homebrige finished loading cached accessories
    platform.api.on('didFinishLaunching', function() {
      platform.log("Cached accessories loaded.");

      // Starts the timer for updating locations (i.e. adding and removing locks of the user)
      platform.updateLocations(true, function() {});
      setInterval(function() {
        platform.updateLocations(true, function() {});
      }, platform.config.locationUpdateInterval);
    });
  } else {
    log("Homebridge API not available, please update your homebridge version!");
  }
}

/**
 * Signs the user in with the credentials provided in the configuration.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.signIn = function(callback) {
  var platform = this;

  // Validates the configuration
  if (!platform.config.apiUri) {
    platform.log("No API URI for nello.io provided.");
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
  platform.user = null;
  platform.locations = [];
  platform.jar = request.jar();
  request({
      uri: platform.config.apiUri + "/login",
      method: "POST",
      jar: platform.jar,
      json: {
          "username": platform.config.username,
          "password": platform.config.password
      }
  }, function (error, response, body) {
    
    // Checks if the API returned a positive result
    if (error || response.statusCode != 200) {
      platform.signOut();
      platform.log("Error while signing in.");
      return callback(false);
    }

    // Stores the user information
    platform.user = body.user;
    platform.log("Signed in.");
    return callback(true);
  });
}

/**
 * Signs the user out. This is a helper method that clears the session. Is called everytime an API call fails.
 */
NelloPlatform.prototype.signOut = function() {
  var platform = this;

  // Clears the session information
  platform.user = null;
  platform.locations = [];
  platform.jar = null;
}

/**
 * Sends a request to the API to open the lock.
 * @param locationId The ID of the location for which the lock is to be opened.
 * @param retry Determines whether the platform should retry signing in and opening the lock if the first attempt fails.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.open = function(locationId, retry, callback) {
  var platform = this;

  // Checks if the user is signed in 
  platform.log("Opening door at location with ID " + locationId + ".");
  if (!platform.user) {
    return platform.signIn(function (result) {
      if (result) {
        return platform.open(locationId, true, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    });
  }
  
  // Sends the request to open the lock
  request({
    uri: platform.config.apiUri + "/locations/" + locationId + "/users/" + platform.user.user_id + "/open",
    method: "POST",
    jar: platform.jar,
    json: {
        "type": "swipe"
    }
  }, function (error, response, body) {
    
    // Checks if the API returned a positive result
    if (error || response.statusCode != 200) {
      platform.log("Opening door at location with ID " + locationId + " failed.");
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

/**
 * Sends a request to the API to get all locations.
 * @param retry Determines whether the platform should retry signing in and getting the locations if the first attempt fails.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.updateLocations = function(retry, callback) {
  var platform = this;

  // Checks if the user is signed in 
  platform.log("Getting locations from nello.io.");
  if (!platform.user) {
    return platform.signIn(function (result) {
      if (result) {
        return platform.updateLocations(true, callback);
      } else {
        platform.updateReachability();
        callback(false);
      }
    });
  }

  // Sends a request to the API to get all locations of the user
  request({
    uri: platform.config.apiUri + "/locations",
    method: "GET",
    jar: platform.jar,
    json: true
  }, function (error, response, body) {
    
    // Checks if the API returned a positive result
    if (error || response.statusCode != 200) {
      platform.log("Getting locations from nello.io failed.");
      platform.signOut();

      if (retry) {
        platform.log("Retry signing in and getting locations again.");
        return platform.updateLocations(false, callback);
      }

      platform.updateReachability();
      return callback(false);
    }

    // Stores the location information
    platform.locations = body.geofences;

    // Cycles through all existing homebridge accessory to remove the ones that do not exist in nello.io
    for (var i = 0; i < platform.accessories.length; i++) {

      // Checks if the location exists
      var locationExists = false;
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
      var accessoryExists = false;
      for (var j = 0; j < platform.accessories.length; j++) {
        if (platform.accessories[j].context.locationId == platform.locations[i].location_id) {
          accessoryExists = true;
        }
      }

      // Creates the new accessory
      if (!accessoryExists) {
        platform.addAccessory(platform.locations[i].location_id);
      }
    }

    // Returns a positive result
    platform.updateReachability();
    platform.log("Got locations from nello.io.");
    return callback(true);
  });
}

/**
 * Updates the reachability of all locks. This is based on the current sign in state.
 */
NelloPlatform.prototype.updateReachability = function() {
  var platform = this;

  // Updates the reachability
  for (var i = 0; i < platform.accessories.length; i++) {
    var lockCurrentStateCharacteristic = platform.accessories[i].getService(Service.LockMechanism).getCharacteristic(Characteristic.LockCurrentState);

    // If the user is not signed in, the lock state should be unknown
    if (!platform.user) {
      if (platform.config.exposeReachability) {
        lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.UNKNOWN);
      } else {
        lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
      }
    }
    
    // If the user is signed in, the value of the characteristic should only be updated when it is unknown
    if (platform.user && !platform.accessories[i].context.reachable) {
      lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
    }

    // Updates the reachable variable
    platform.accessories[i].context.reachable = platform.user;
  }
}

/**
 * Adds a new accessory to the platform.
 * @param locationId The ID of the location for which the accessory is to be created.
 */
NelloPlatform.prototype.addAccessory = function(locationId) {
  var platform = this;

  // Gets the corresponding location object
  platform.log("Adding new accessory with location ID " + locationId + ".");
  var location = null;
  for (var i = 0; i < platform.locations.length; i++) {
    if (platform.locations[i].location_id == locationId) {
      location = platform.locations[i]; 
    }
  }

  // Checks if the location has been found
  if (!location) {
    platform.log("Error while adding new accessory with location ID " + locationId + ": not received from nello.io.");
    return;
  }

  // Creates the name for the accessory
  var accessoryName = location.address.street + ", " + location.address.city;
  platform.log("Accessory name for location ID " + locationId + " is " + accessoryName + ".");

  // Creates the new accessory
  var accessory = new Accessory(accessoryName, UUIDGen.generate(accessoryName));
  accessory.context.locationId = locationId;
  accessory.context.reachable = true;

  // Creates the lock mechanism service for the accessory
  accessory.addService(Service.LockMechanism, accessoryName);
  
  // configures the accessory
  platform.configureAccessory(accessory);

  // Adds the accessory
  platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
  platform.log("Accessory for location with ID " + locationId + " added.");
}

/**
 * Configures a previously cached accessory.
 * @param accessory The cached accessory.
 */
NelloPlatform.prototype.configureAccessory = function(accessory) {
  var platform = this;
  platform.log("Configuring accessory with location ID " + accessory.context.locationId + ".");

  // Updates the accessory information
  var accessoryInformationService = accessory.getService(Service.AccessoryInformation);
  accessoryInformationService.setCharacteristic(Characteristic.Manufacturer, "nello.io")
  accessoryInformationService.setCharacteristic(Characteristic.Model, "Nello One")
  accessoryInformationService.setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  // Updates the lock mechanism
  var lockMechanismService = accessory.getService(Service.LockMechanism);
  lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
  lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
  accessory.context.reachable = true;
  
  // Handles setting the target lock state
  lockMechanismService.getCharacteristic(Characteristic.LockTargetState).on('set', function(value, callback) {
    callback(null);

    // Actually opens the door
    if (value == Characteristic.LockTargetState.UNSECURED) {
      platform.open(accessory.context.locationId, true, function(result) {
        if (result) {

          // Leaves the lock unsecured for some time (the lock timeout)
          lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
          setTimeout(function() {
            lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
            lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
          }, platform.config.lockTimeout);
        } else {

          // Updates the reachability and reverts the target state of the lock
          lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
          platform.updateReachability();
        }
      });
    }
  });

  // Adds the accessory
  platform.accessories.push(accessory);
}

/**
 * Removes an accessory from the platform.
 * @param locationId The ID of the location for which the accessory is to be removed.
 */
NelloPlatform.prototype.removeAccessory = function(locationId) {
  var platform = this;

  // Initializes the lists for remaining and removed accessories
  platform.log("Removing accessory with location ID " + locationID);
  var remainingAccessories = [];
  var removedAccessories = [];

  // Adds the accessories to the two lists
  for (var i = 0; i < platform.accessories.length; i++) {
    if (platform.accessories[i].context.locationId == locationId) {
      removedAccessories.push(platform.accessories[i]);
    } else {
      remainingAccessories.push(platform.accessories[i]);
    }
  }

  // Removes the accessories
  if (removedAccessories.length > 0) {
    platform.api.unregisterPlatformAccessories(pluginName, platformName, removedAccessories);
    platform.accessories = remainingAccessories;
    platform.log(removedAccessories.length + " accessories removed.");
  }
}