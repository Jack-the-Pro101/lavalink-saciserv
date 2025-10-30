export interface DecryptSignatureReq {
  encrypted_signature: string;
  n_param: string;
  player_url: string;
}

export interface DecryptSignatureRes {
  decrypted_signature: string;
  decrypted_n_sig: string;
}

export interface SigTimestampReq {
  player_url: string;
}

export interface SigTimestampRes {
  sts: string;
}

export interface ResolveUrlReq {
  stream_url: string;
  player_url: string;
  encrypted_signature: string;
  signature_key: string;
  n_param: string;
}

export interface ResolveUrlRes {
  resolved_url: string;
}

export type PossibleBody = DecryptSignatureReq | SigTimestampReq | ResolveUrlReq;
