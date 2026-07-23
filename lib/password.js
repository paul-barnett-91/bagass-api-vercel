const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

// Dummy hash with the right shape to run through when no user is found, so
// login timing doesn't leak whether a username exists.
const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(KEY_LENGTH * 2)}`;

async function verifyPassword(password, stored) {
  const [salt, key] = (stored || DUMMY_HASH).split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
}

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
