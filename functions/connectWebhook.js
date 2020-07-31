const io = require('socket.io-client');
const express = require('express');

function processWebhookData(platform, data) {
  const { Characteristic, Service } = platform;

  switch (data.action) {
    case 'swipe':
      platform.log(`${data.data.name} opened the door with ID ${data.data.location_id}`);
      break;
    case 'tw':
      platform.log(`The door with ID ${data.data.location_id} has been opened in the time window ${data.data.name}.`);
      break;
    case 'geo':
      platform.log(`${data.data.name} opened the door with ID ${data.data.location_id} via geofence.`);
      break;
    case 'deny':
      platform.log(`Someone rang the bell of the door with ID ${data.data.location_id}.`);
      break;
    default:
      break;
  }

  const accessory = platform.accessories.find(
    (acc) => acc.context.locationId === data.data.location_id,
  );

  if (accessory) {
    if (data.action === 'deny') {
      if (accessory.context.alwaysOpen) {
        platform.open(accessory.context.locationId, true, (result) => {
          const lockMechanismService = accessory.service(Service.LockMechanism);
          if (result) {
            // Leaves the lock unsecured for some time (the lock timeout)
            lockMechanismService.setCharacteristic(
              Characteristic.LockCurrentState,
              Characteristic.LockCurrentState.UNSECURED,
            );
            setTimeout(() => {
              lockMechanismService.setCharacteristic(
                Characteristic.LockTargetState,
                Characteristic.LockTargetState.SECURED,
              );
              lockMechanismService.setCharacteristic(
                Characteristic.LockCurrentState,
                Characteristic.LockCurrentState.SECURED,
              );
            }, platform.config.lockTimeout);
          } else {
            // Updates the reachability and reverts the target state of the lock
            lockMechanismService.setCharacteristic(
              Characteristic.LockTargetState,
              Characteristic.LockTargetState.SECURED,
            );
            platform.updateReachability();
          }
        });
        return;
      }

      if (accessory.videoDoorbell) {
        accessory.videoDoorbell.getCharacteristic(
          Characteristic.ProgrammableSwitchEvent,
        ).setValue(0);
      }

      // Trigger the motion sensor
      if (platform.config.motionSensor) {
        accessory.context.motion = true;
        accessory.service(Service.MotionSensor).setCharacteristic(
          Characteristic.MotionDetected,
          true,
        );
        setTimeout(() => {
          accessory.context.motion = false;
          accessory.service(Service.MotionSensor).setCharacteristic(
            Characteristic.MotionDetected,
            false,
          );
        }, platform.config.motionTimeout);
      }
    } else if (data.action === 'tw' || data.action === 'geo' || data.action === 'swipe') {
      if (data.action === 'swipe' && platform.config.homekitUser === data.data.name) {
        return;
      }

      // Gets the lock state characteristic
      const lockMechanismService = accessory.getService(Service.LockMechanism);

      // Leaves the lock unsecured for some time (the lock timeout)
      lockMechanismService.setCharacteristic(
        Characteristic.LockCurrentState,
        Characteristic.LockCurrentState.UNSECURED,
      );
      setTimeout(() => {
        lockMechanismService.setCharacteristic(
          Characteristic.LockTargetState,
          Characteristic.LockTargetState.SECURED,
        );
        lockMechanismService.setCharacteristic(
          Characteristic.LockCurrentState,
          Characteristic.LockCurrentState.SECURED,
        );
      }, platform.config.lockTimeout);
    }
  } else {
    platform.log(`Fake update of lock with ID ${data.data.location_id} failed. The lock is not available anymore.`);
  }
}

function registerWebhook(platform) {
  const app = express();

  app.use(express.json());

  app.put('/', (req, res) => {
    processWebhookData(platform, req.body);
    res.status(200).send('OK');
  });

  const port = platform.config.webhookServerPort;

  app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    platform.locations.forEach((location) => {
      platform.updateWebhook(
        location.location_id,
        platform.config.publicWebhookUrl,
        true,
        () => {},
      );
    });
  });
}

function connectToWebhookRelay(platform) {
  const socket = io('https://nello-socket.alexdev.de', { transports: ['websocket'] });
  socket.on('error', (err) => {
    platform.log(err);
  });
  socket.on('connect', () => {
    platform.log('Connected to webhook backend.');
    socket.emit('getWebhook');
  });
  socket.on('webhook', (data) => {
    // Updates the webhooks of all locations
    platform.locations.forEach((location) => {
      platform.updateWebhook(location.location_id, data.url, true, () => { });
    });
  });
  socket.on('call', (data) => {
    if (data && data.action) {
      processWebhookData(platform, data);
    }
  });
}

module.exports = function connectWebhook() {
  const platform = this;

  if (platform.config.publicWebhookUrl) {
    registerWebhook(platform);
  } else {
    platform.log('Connecting to webhook relay service');
    connectToWebhookRelay(platform);
  }
};
