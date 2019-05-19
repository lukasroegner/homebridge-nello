var homebridgeObj = null;
var pluginName = "homebridge-nello";
var platformName = "NelloPlatform";

/**
 * Defines the export of the platform module.
 * @param homebridge The homebridge object that contains all classes, objects and functions for communicating with HomeKit.
 */
module.exports = function (homebridge) {

  // Gets the classes required for implementation of the plugin
  homebridgeObj = homebridge;

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
  const platform = this;

  //Save objects for functions
  platform.Accessory = homebridgeObj.platformAccessory;
  platform.Categories = homebridgeObj.hap.Accessory.Categories;
  platform.Service = homebridgeObj.hap.Service;
  platform.Characteristic = homebridgeObj.hap.Characteristic;
  platform.UUIDGen = homebridgeObj.hap.uuid;
  platform.hap = homebridgeObj.hap;
  platform.pluginName = pluginName;
  platform.platformName = platformName;

  // Checks whether a configuration is provided, otherwise the plugin should not be initialized
  if (!config) {
    return;
  }

  // Defines the variables that are used throughout the platform
  platform.log = log;
  platform.config = config;
  platform.token = null;
  platform.locations = [];
  platform.accessories = [];

  // Initializes the configuration
  platform.config.apiUri = "https://public-api.nello.io/v1";
  platform.config.authUri = "https://auth.nello.io";
  platform.config.publicWebhookUrl = platform.config.publicWebhookUrl || '';
  platform.config.webhookServerPort = platform.config.webhookServerPort || 5000;
  platform.config.authType = platform.config.authType || 'password';
  platform.config.lockTimeout = platform.config.lockTimeout || 5000;
  platform.config.locationUpdateInterval = platform.config.locationUpdateInterval == 0 ? 0 : (platform.config.locationUpdateInterval || 3600000);
  platform.config.exposeReachability = platform.config.exposeReachability;
  platform.config.motionTimeout = platform.config.motionTimeout || 5000;
  platform.config.video = platform.config.video || {};
  platform.config.video.stream = platform.config.video.stream || "-re -i";
  platform.config.video.snapshotImage = platform.config.video.snapshotImage || "http://via.placeholder.com/1280x720";
  platform.config.video.maxWidth = platform.config.video.maxWidth || 1280;
  platform.config.video.maxHeight = platform.config.video.maxHeight || 720;
  platform.config.video.maxFPS = platform.config.video.maxFPS || 30;
  platform.config.video.vcodec = platform.config.video.vcodec || "h264_omx";
  platform.config.video.rotate = platform.config.video.rotate || 0;

  // Checks whether the API object is available
  if (api) {

    // Saves the API object to register new locks later on
    log("Homebridge API available.");
    platform.api = api;

    // Subscribes to the event that is raised when homebrige finished loading cached accessories
    platform.api.on('didFinishLaunching', function () {
      platform.log("Cached accessories loaded.");

      // Initially updates the locations to get the locks
      platform.updateLocations(true, function () {

        // Starts the timer for updating locations (i.e. adding and removing locks of the user)
        if (platform.config.locationUpdateInterval > 0) {
          setInterval(function () {
            platform.updateLocations(true, function () { });
          }, platform.config.locationUpdateInterval);
        }

        //Connect to backend
        platform.connectWebhook();
      });
    });
  } else {
    log("Homebridge API not available, please update your homebridge version!");
  }
}

/**
 * Signs the user in with the credentials provided in the configuration.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.signIn = require('./functions/signIn');

/**
 * Signs the user out. This is a helper method that clears the session. Is called everytime an API call fails.
 */
NelloPlatform.prototype.signOut = require('./functions/signOut');

/**
 * Sends a request to the API to open the lock.
 * @param locationId The ID of the location for which the lock is to be opened.
 * @param retry Determines whether the platform should retry signing in and opening the lock if the first attempt fails.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.open = require('./functions/open');

/**
 * Sends a request to the API to get all locations.
 * @param retry Determines whether the platform should retry signing in and getting the locations if the first attempt fails.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.updateLocations = require('./functions/updateLocations');

/**
 * Sends a request to the API to update the webhook URI.
 * @param locationId The ID of the location for which the webhook is to be updated.
 * @param uri The URI of the new webhook.
 * @param retry Determines whether the platform should retry signing in and updating the webhook if the first attempt fails.
 * @param callback The callback function that gets a boolean value indicating success or failure.
 */
NelloPlatform.prototype.updateWebhook = require('./functions/updateWebhook');

/**
 * Updates the reachability of all locks. This is based on the current sign in state.
 */
NelloPlatform.prototype.updateReachability = require('./functions/updateReachability');

/**
 * Adds a new accessory to the platform.
 * @param locationId The ID of the location for which the accessory is to be created.
 */
NelloPlatform.prototype.addAccessory = require('./functions/addAccessory');

/**
 * Adds a camera accessory.
 *  @param accessory The accessory which should get a camera.
 */
NelloPlatform.prototype.addCamera = require('./functions/addCamera');

/**
 * Opens connection to the webhook backend.
 */
NelloPlatform.prototype.connectWebhook = require('./functions/connectWebhook');

/**
 * Configures a previously cached accessory.
 * @param accessory The cached accessory.
 */
NelloPlatform.prototype.configureAccessory = require('./functions/configureAccessory');

/**
 * Removes an accessory from the platform.
 * @param locationId The ID of the location for which the accessory is to be removed.
 */
NelloPlatform.prototype.removeAccessory = require('./functions/removeAccessory');
