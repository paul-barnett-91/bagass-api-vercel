const crypto = require("crypto");

// Minimal HS256 JWT sign/verify using Node's built-in crypto - avoids adding
// a dependency for something this small, while staying wire-compatible with
// standard JWT libraries/tools.

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64");
}

function sign(payload, secret, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64urlEncode(signature)}`;
}

function verify(token, secret) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const providedSignature = base64urlDecode(encodedSignature);

  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf8"));
  } catch (err) {
    return null;
  }

  if (typeof payload.exp === "number" && Math.floor(Date.now() / 1000) >= payload.exp) {
    return null;
  }

  return payload;
}

module.exports = { sign, verify };
