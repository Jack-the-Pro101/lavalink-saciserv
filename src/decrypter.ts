import { Player, Utils, Platform, Types } from "youtubei.js";

Platform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
  const properties = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

export interface DecryptSignatureRequest {
  encrypted_signature: string;
  n_param: string;
  player_url: string;
}

export interface DecryptSignatureResponse {
  decrypted_signature: string;
  decrypted_n_sig: string;
}

export interface GetStsRequest {
  player_url: string;
}

export interface GetStsResponse {
  sts: string;
}

export interface ResolveUrlRequest {
  stream_url: string;
  player_url: string;
  encrypted_signature: string;
  signature_key?: string;
  n_param?: string;
}

export interface ResolveUrlResponse {
  resolved_url: string;
}

const playerCache = new Map<string, Player>();
export interface DecryptExports {
  nFunction: (param: string) => string;
  sigFunction: (param: string) => string;
}

export const getPlayer = async (playerUrl: string): Promise<Player> => {
  let player = playerCache.get(playerUrl);

  console.log("Fetching player for URL:", playerUrl);

  if (!player) {
    const playerId = Utils.getStringBetweenStrings(playerUrl, "player/", "/");

    try {
      player = await Player.create(undefined, undefined, undefined, playerId);
      playerCache.set(playerUrl, player);

      return player;
    } catch (error) {
      console.error("Error creating player:", error);
      throw new Error("Failed to create player");
    }
  }

  return player;
};
