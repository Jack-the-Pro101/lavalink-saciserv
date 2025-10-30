// import { JsAnalyzer, JsExtractor } from "youtubei.js";

import { DecryptSignatureReq, DecryptSignatureRes, PossibleBody, ResolveUrlReq, SigTimestampReq } from "../types.d.ts";
import { DecryptExports, getPlayer, GetStsResponse, ResolveUrlResponse } from "./decrypter.ts";

const allNonNulls = (requiredFields: string[]): boolean => {
  for (const field of requiredFields) {
    if (field == null) {
      console.log("Jit in ", requiredFields, " is null");
      return false;
    }
  }

  return true;
};

function ResJson(json: unknown) {
  return new Response(JSON.stringify(json), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(
  {
    port: 8001,
    onListen(addr) {
      console.log(`Decrypter server running on http://${addr.hostname}:${addr.port}`);
    },
  },
  async (req) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    try {
      const data = (await req.json()) as PossibleBody;

      if (data.player_url == null) {
        return new Response("Bad Request, missing player URL", { status: 400 });
      }

      const url = new URL(req.url);
      const pathname = url.pathname;

      const player = await getPlayer(data.player_url);

      switch (pathname) {
        case "/decrypt_signature": {
          const { encrypted_signature, n_param } = data as DecryptSignatureReq;

          if (!allNonNulls([encrypted_signature, n_param])) {
            return new Response("Bad Request", { status: 400 });
          }

          const fun: DecryptExports = new Function(`${player.data!.output}\nreturn exportedVars;`)() as DecryptExports;
          const decryptResponse: DecryptSignatureRes = {
            decrypted_signature: fun.sigFunction(encrypted_signature),
            decrypted_n_sig: fun.nFunction(n_param),
          };
          return ResJson(decryptResponse);
        }
        case "/get_sts": {
          const stsResponse: GetStsResponse = {
            sts: player.signature_timestamp.toString(),
          };

          return ResJson(stsResponse);
        }
        case "/resolve_url": {
          const { stream_url, encrypted_signature, signature_key, n_param } = data as ResolveUrlReq;

          if (!allNonNulls([stream_url])) {
            return new Response("Bad Request", { status: 400 });
          }

          console.log("Resolving URL:", stream_url);

          try {
            const deciphered = await player.decipher(stream_url);
            const resolveUrlResponse: ResolveUrlResponse = {
              resolved_url: deciphered,
            };

            return ResJson(resolveUrlResponse);
          } catch (error) {
            console.error("Error during URL resolution:", error);
            return new Response("Internal Server Error", { status: 500 });
          }
        }
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
  }
);

// API Specification
// POST /decrypt_signature

// Request Body:

// {
//   "encrypted_signature": "...",
//   "n_param": "...",
//   "player_url": "..."
// }

//     encrypted_signature (string): The encrypted signature from the video stream.
//     n_param (string): The n parameter value.
//     player_url (string): The URL to the JavaScript player file that contains the decryption logic.

// Successful Response:

// {
//   "decrypted_signature": "...",
//   "decrypted_n_sig": "..."
// }

// Example curl request:

// curl -X POST http://localhost:8001/decrypt_signature \
// -H "Content-Type: application/json" \
// -H "Authorization: your_secret_token" \
// -d '{
//   "encrypted_signature": "...",
//   "n_param": "...",
//   "player_url": "https://..."
// }'

// POST /get_sts

// Extracts the signature timestamp (sts) from a player script.

// Request Body:

// {
//   "player_url": "..."
// }

//     player_url (string): The URL to the JavaScript player file.

// Successful Response:

// {
//   "sts": "some_timestamp"
// }

// Example curl request:

// curl -X POST http://localhost:8001/get_sts \
// -H "Content-Type: application/json" \
// -H "Authorization: your_secret_token" \
// -d '{
//   "player_url": "https://..."
// }'

// POST /resolve_url

// Resolves a raw stream URL by handling the signature and n-parameter decryption, returning a fully constructed and ready-to-use playback URL.

// Request Body:

// {
//   "stream_url": "...",
//   "player_url": "...",
//   "encrypted_signature": "...",
//   "signature_key": "...",
//   "n_param": "..."
// }

//     stream_url (string): The initial stream URL (not video url).
//     player_url (string): The URL to the JavaScript player file.
//     encrypted_signature (string): The encrypted signature value.
//     signature_key (string, optional): The query parameter key to use for the decrypted signature in the final URL. Defaults to sig.
//     n_param (string, optional): The n parameter value. If not provided, it will be extracted from the stream_url.

// Successful Response:

// {
//   "resolved_url": "..."
// }
