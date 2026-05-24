let lastMotionTime = Date.now();

module.exports = (data) => {

  let result = {

    fan_intake: 0,
    fan_exhaust: 0,

    power_saving: false,

    mode: "NORMAL"
  };

  // Motion Detection

  if (data.motion == 1) {

    lastMotionTime = Date.now();
  }

  // Check Idle Time

  const idleTime =
    Date.now() - lastMotionTime;

  // 5 menit
  const timeout =
    5 * 60 * 1000;

  // Power Saving Mode

  if (idleTime > timeout) {

    result.power_saving = true;

    result.mode =
      "POWER SAVING";

    return result;
  }

  // Temperature Control

  if (data.temperature > 27) {

    result.fan_intake = 1;

    result.fan_exhaust = 1;
  }

  // Air Quality Control

  if (data.air_quality > 1500) {

    result.fan_exhaust = 1;
  }

  return result;
};