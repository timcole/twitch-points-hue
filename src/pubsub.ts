import * as WebSocket from "ws";
import TwitchPointsHue from ".";
import { v3 as hue } from "node-hue-api";
import { RGB, Redeem } from "./interfaces";
import { RGB2HSL, rand } from "./helpers";

class PubSub extends TwitchPointsHue {
  private url: string = "wss://pubsub-edge.twitch.tv";
  protected connection: WebSocket;
  private heartbeat: NodeJS.Timeout;
  private topic: string;
  private colours: { [key: string]: RGB } = {
    red: { R: 255, G: 0, B: 0 },
    green: { R: 0, G: 255, B: 0 },
    blue: { R: 0, G: 0, B: 255 },
    pink: { R: 255, G: 50, B: 255 },
    off: { R: 0, G: 0, B: 0 },
    black: { R: 0, G: 0, B: 0 },
    purple: { R: 170, G: 0, B: 255 },
    white: { R: 255, G: 255, B: 255 },
  };

  constructor(channel: number) {
    super();
    this.run();

    this.topic = `community-points-channel-v1.${channel}`;

    this.connection = new WebSocket(this.url);
    this.connection.onopen = this.onOpen.bind(this);
    this.connection.onmessage = this.onMessage.bind(this);
    this.connection.onclose = this.onClose.bind(this);
  }

  private sendPing(): void {
    this.connection.send(JSON.stringify({ type: "PING" }));
  }

  private listen(): void {
    this.connection.send(
      JSON.stringify({
        type: "LISTEN",
        data: { topics: [this.topic] },
      })
    );
  }

  private onOpen(): void {
    console.log("connection opened");
    this.sendPing();
    this.listen();
    this.heartbeat = setInterval(this.sendPing.bind(this), 6e4);
  }

  private onClose(): void {
    console.warn("connection closed");
    clearInterval(this.heartbeat);
  }

  private onMessage({ data }: any): void {
    let msg = JSON.parse(data);
    if (!msg.data) return;
    if (msg.data.topic && msg.data.topic === this.topic && msg.data.message)
      this.onRedeem(JSON.parse(msg.data.message));
  }

  protected onRedeem(msg: Redeem) {
    switch (msg.data.redemption.reward.id) {
      case "c385bb4b-6742-419e-94ea-738e044af7df":
        const colour = this.parseColour(msg.data.redemption.user_input);
        console.log(
          `${
            msg.data.redemption.user.login
          } set the lights to rgb(${Object.values(colour)})`
        );
        const hsl = RGB2HSL(colour.R, colour.G, colour.B);
        const lightState = new hue.lightStates.LightState()
          .reset()
          .on(true)
          .brightness(100)
          .hsl(hsl[0], hsl[1], hsl[2]);
        this.setAllLights(lightState);
        break;
    }
  }

  private parseColour(raw: string): RGB {
    switch (true) {
      // Predefined colours
      case this.colours[raw] != undefined:
        return this.colours[raw];
      // RGB Values
      case raw.split(" ", 3).length == 3:
        let parts = raw.split(" ", 3);
        let values: number[] = parts.map((s) => {
          let v = Number(s);
          return v >= 255 ? 255 : v < 0 ? 0 : v;
        });
        return { R: values[0], G: values[1], B: values[2] };
      // Hex Values
      case raw.startsWith("#"):
        let parsed = parseInt(raw.replace(/[^0-9A-F]/gi, ""), 16);
        return {
          R: (parsed >> 16) & 255,
          G: (parsed >> 8) & 255,
          B: parsed & 255,
        };
      // Fall back - random
      default:
        return { R: rand(0, 255), G: rand(0, 255), B: rand(0, 255) };
    }
  }
}

new PubSub(51684790);
