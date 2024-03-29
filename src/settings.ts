/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'homebridge-esp32beacon';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'Homebridge-esp32Beacon';

export type BeaconSetting = {
  name: string;
  triggerDetectionThreshold: number;
  maintainDetectionThreshold: number;
};