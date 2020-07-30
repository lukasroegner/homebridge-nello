module.exports = function (locationId) {
  const platform = this;

  // Initializes the lists for remaining and removed accessories
  platform.log(`Removing accessory with location ID ${locationID}`);
  const remainingAccessories = [];
  const removedAccessories = [];

  // Adds the accessories to the two lists
  for (let i = 0; i < platform.accessories.length; i++) {
    if (platform.accessories[i].context.locationId == locationId) {
      removedAccessories.push(platform.accessories[i]);
      if (platform.accessories[i].videoDoorbell) {
        removedAccessories.push(platform.accessories[i].videoDoorbell);
      }
    } else {
      remainingAccessories.push(platform.accessories[i]);
    }
  }

  // Removes the accessories
  if (removedAccessories.length > 0) {
    platform.api.unregisterPlatformAccessories(platform.pluginName, platform.platformName, removedAccessories);
    platform.accessories = remainingAccessories;
    platform.log(`${removedAccessories.length} accessories removed.`);
  }
};
