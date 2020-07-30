module.exports = function () {
  const platform = this;

  // Clears the session information
  platform.token = null;
  platform.locations = [];
};
