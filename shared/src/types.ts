export type Signal = {
  id: string;
  label: string;
  score: number;
  source: string;
};

export type VideoPlan = {
  hook: string;
  scenes: string[];
  voiceover: string;
  style: string;
};

export type PostPayload = {
  text: string;
  signalsRef: string;
  videoPlan: VideoPlan;
  planCid?: string;
  videoCid?: string;
  timestamp: number;
};

export type Attestation = {
  verificationType: string;
  messageHash: string;
  proof: string;
};

// Convenience DTO shape for client/server contract; server also defines this locally.
export type PostResult = {
  signals: Signal[];
  postText: string;
  videoPlan: VideoPlan;
  payloadHash: string;
  attestation: Attestation;
  planCid: string;
  videoCid: string;
  txHash: string;
};


