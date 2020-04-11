import { v3 as hue } from "node-hue-api";
import Api from "node-hue-api/lib/api/Api";
import { promises as fs } from "fs";

interface IUser {
  username: string;
  clientkey: string;
  name: string;
  ipaddress: string;
  modelid: string;
  swversion: string;
}

class TwitchPointsHue {
  private name: string;
  protected user: IUser;
  private cache: string;
  protected bridge: Api;

  constructor() {
    this.name = "TwitchChannelPoints";
    this.cache = ".user";
  }

  protected async run(): Promise<void> {
    const userFile = await fs.readFile(this.cache, "utf-8").catch(() => {});
    if (userFile) this.user = JSON.parse(userFile);

    const discoveryResults = await hue.discovery.nupnpSearch();
    setTimeout((): void => (this.user = null), 3e4);
    while (this.user === undefined) {
      await this.discoverBridge(discoveryResults);
    }
    if (this.user === null) return;

    await this.login();
  }

  private async discoverBridge(bridges: any[]): Promise<void> {
    console.log(
      `Found ${bridges.length} ${
        bridges.length > 1 ? "bridges" : "bridge"
      }. Press the link button on one to connect.`
    );

    for await (let bridge of bridges) {
      const localConnect: Api = await hue.api
        .createLocal(bridge.ipaddress)
        .connect();

      localConnect.users
        .createUser(this.name, this.name)
        .then(async (user) => {
          this.user = { ...user, ...bridge };
          await fs.writeFile(this.cache, JSON.stringify(this.user, null, 2));
        })
        .catch((err) => {
          if (err.getHueErrorType && err.getHueErrorType() !== 101) return;
        });
    }
  }

  private async login() {
    this.bridge = await hue.api
      .createLocal(this.user.ipaddress)
      .connect(this.user.username);
  }

  protected async setAllLights(lightState: any) {
    const lights = await this.bridge.lights.getAll();
    lights.map(async (light) => {
      await this.bridge.lights.setLightState(light.id, lightState);
    });
  }
}

export default TwitchPointsHue;
