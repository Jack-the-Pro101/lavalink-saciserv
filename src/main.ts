import { Innertube } from "youtubei.js";
import { JsAnalyzer, JsExtractor, JsHelpers, JsMatchers } from "youtubei.js";
import { DecryptSignatureReq, PossibleBody, ResolveUrlReq, SigTimestampReq } from "../types.d.ts";
const innertube = await Innertube.create({});

Deno.serve({ port: 8001 }, async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const data = (await req.json()) as PossibleBody;

    const url = new URL(req.url);
    const pathname = url.pathname;

    const jsCode = await (await fetch(data.player_url)).text();

    const jsAnalyzer = new JsAnalyzer(jsCode);
    const jsExtractor = new JsExtractor(jsAnalyzer);

    switch (pathname) {
      case "/decrypt_signature": {
        const { encrypted_signature, n_param, player_url } = data as DecryptSignatureReq;

        break;
      }
      case "/get_sts": {
        const { player_url } = data as SigTimestampReq;

        break;
      }
      case "/resolve_url": {
        const { stream_url, encrypted_signature, signature_key, n_param } = data as ResolveUrlReq;

        break;
      }
      default:
        return new Response("Not Found", { status: 404 });
    }
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
});

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
