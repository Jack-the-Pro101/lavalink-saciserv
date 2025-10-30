import { DecryptSignatureReq, DecryptSignatureRes, PossibleBody, ResolveUrlReq, SigTimestampReq } from "../types.d.ts";
import { DecryptExports, getPlayer, GetStsResponse, ResolveUrlResponse } from "./decrypter.ts";

const allNonNulls = (requiredFields: string[]): boolean => {
  for (const field of requiredFields) {
    if (field == null) {
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
