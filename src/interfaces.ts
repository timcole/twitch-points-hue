export interface Redeem {
  type: string;
  data: Data;
}

export interface Data {
  timestamp: Date;
  redemption: Redemption;
}

export interface Redemption {
  id: string;
  user: User;
  channel_id: string;
  redeemed_at: Date;
  reward: Reward;
  user_input: string;
  status: string;
  cursor: string;
}

export interface Reward {
  id: string;
  channel_id: string;
  title: string;
  prompt: string;
  cost: number;
  is_user_input_required: boolean;
  is_sub_only: boolean;
  image: null;
  default_image: DefaultImage;
  background_color: string;
  is_enabled: boolean;
  is_paused: boolean;
  is_in_stock: boolean;
  max_per_stream: MaxPerStream;
  should_redemptions_skip_request_queue: boolean;
}

export interface DefaultImage {
  url_1x: string;
  url_2x: string;
  url_4x: string;
}

export interface MaxPerStream {
  is_enabled: boolean;
  max_per_stream: number;
}

export interface User {
  id: string;
  login: string;
  display_name: string;
}

export interface RGB {
  R: number;
  G: number;
  B: number;
}
