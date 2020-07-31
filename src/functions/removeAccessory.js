module.exports = function removeAccessory(locationId) {
  const platform = this;

  // Initializes the lists for remaining and removed accessories
  platform.log(`Removing accessory with location ID ${locationId}`);

  const remainingAccessories = [];
  const removedAccessories = [];

  // Adds the accessories to the two lists
  platform.accessories.forEach((accessory) => {
    if (accessory.context.locationId === locationId) {
      removedAccessories.push(accessory);
      if (accessory.videoDoorbell) {
        removedAccessories.push(accessory.videoDoorbell);
      }
    } else {
      remainingAccessories.push(accessory);
    }
  });

  // Removes the accessories
  if (removedAccessories.length > 0) {
    platform.api.unregisterPlatformAccessories(
      platform.pluginName,
      platform.platformName,
      removedAccessories,
    );
    platform.accessories = remainingAccessories;
    platform.log(`${removedAccessories.length} accessories removed.`);
  }
};
