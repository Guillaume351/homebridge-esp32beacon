import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { BeaconSetting, PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { EspSwitchPlatformAccessory } from './platformAccessory';

import httpServer from './server';
import { BeaconHandler } from './beaconHandler';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class BeaconPlatform implements DynamicPlatformPlugin {
  public static instance: BeaconPlatform; // TODO : replace this once I learn typescript/javascript..

  public static Service: typeof Service;
  public static Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public static readonly accessories: PlatformAccessory[] = [];

  public static apiAccess : API;

  public beaconHandler: BeaconHandler;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    BeaconPlatform.instance = this;
    this.beaconHandler = new BeaconHandler();

    this.log.info('Loading values from config : ', this.config.devices);

    this.log.debug('Finished initializing platform:', this.config.name);
    BeaconPlatform.apiAccess = this.api;
    BeaconPlatform.Service = this.api.hap.Service;
    BeaconPlatform.Characteristic = this.api.hap.Characteristic;

    this.log.info('Starting esp32Beacon server...');

    this.log.debug('Starting REST server ...');
    const PORT = 6060;
    httpServer.listen(PORT);
    this.log.debug('REST server started on PORT ', PORT);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      //this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the beacon to the beacon handler
    this.beaconHandler.addBeacon(accessory);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    BeaconPlatform.accessories.push(accessory);
  }

  public addNewAccessory(displayName: string, uuid: string){
    // the accessory does not yet exist, so we need to create it
    this.log.info('Adding new accessory:', displayName);

    // create a new accessory
    const accessory = new this.api.platformAccessory(displayName, uuid);

    // store a copy of the device object in the `accessory.context`
    // the `context` property can be used to store any data about the accessory you may need
    //accessory.context.device = device;

    // create the accessory handler for the newly create accessory
    // this is imported from `platformAccessory.ts`
    new EspSwitchPlatformAccessory(this, accessory, displayName);

    // link the accessory to your platform
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    // Add default values in config
    const beaconsSettings : Array<Record<string, string | number>> = BeaconPlatform.instance.config.devices;

    const newSetting : BeaconSetting = <BeaconSetting>{};
    newSetting.name = displayName;
    newSetting.triggerDetectionThreshold = BeaconHandler.triggerDetectionThreshold;
    newSetting.maintainDetectionThreshold = BeaconHandler.maintainDetectionThreshold;

    beaconsSettings.push(newSetting);

    // add the beacon to the beacon handler
    this.beaconHandler.addBeacon(accessory);

    BeaconPlatform.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    const exampleDevices = [
      {
        exampleUniqueId: 'ABCD',
        exampleDisplayName: 'Bedroom',
      },
    ];

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of exampleDevices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = BeaconPlatform.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new EspSwitchPlatformAccessory(this, existingAccessory, existingAccessory.displayName);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.exampleDisplayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.exampleDisplayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new EspSwitchPlatformAccessory(this, accessory, accessory.displayName);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
