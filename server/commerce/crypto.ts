import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const EMAIL_CIPHER_VERSION = "v1";

function getHashSecret(): string {
  const secret = process.env.COMMERCE_EMAIL_HASH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("COMMERCE_EMAIL_HASH_SECRET is not configured securely");
  }
  return secret;
}

function getEncryptionKey(): Buffer {
  const encodedKey = process.env.COMMERCE_EMAIL_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error("COMMERCE_EMAIL_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    throw new Error("COMMERCE_EMAIL_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
}

export function normalizeCommerceEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashCommerceEmail(email: string): string {
  return hashCommerceValue(normalizeCommerceEmail(email));
}

/** 이메일 외의 계정 식별자·단발성 인증 코드도 같은 서버 전용 HMAC으로 저장한다. */
export function hashCommerceValue(value: string): string {
  return createHmac("sha256", getHashSecret())
    .update(value)
    .digest("hex");
}

/**
 * 결제 응답과 고객 이메일은 DB에 version.iv.tag.ciphertext 형식으로만 저장한다.
 * 값의 용도별 해시·접근 통제는 호출 계층에서 별도로 적용한다.
 */
export function encryptCommerceValue(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [EMAIL_CIPHER_VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptCommerceValue(value: string): string {
  const [version, ivEncoded, tagEncoded, ciphertextEncoded, extra] = value.split(".");
  if (
    version !== EMAIL_CIPHER_VERSION ||
    !ivEncoded ||
    !tagEncoded ||
    !ciphertextEncoded ||
    extra !== undefined
  ) {
    throw new Error("Invalid encrypted commerce email payload");
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/** 고객 이메일은 정규화한 뒤 암호화해 주문 조회·발송 처리에서만 복호화한다. */
export function encryptCommerceEmail(email: string): string {
  return encryptCommerceValue(normalizeCommerceEmail(email));
}

export function decryptCommerceEmail(value: string): string {
  return decryptCommerceValue(value);
}

/**
 * 비밀값 자체를 노출하지 않고, 해시와 암호화 키가 모두 유효한지 서버에서 확인한다.
 */
export function getCommerceEmailProtectionStatus(): {
  hashSecretConfigured: boolean;
  encryptionKeyConfigured: boolean;
  roundTripVerified: boolean;
} {
  try {
    const probe = "commerce-health@invalid.example";
    const hashSecretConfigured = hashCommerceEmail(probe).length === 64;
    const encrypted = encryptCommerceEmail(probe);
    const encryptionKeyConfigured = decryptCommerceEmail(encrypted) === probe;

    return {
      hashSecretConfigured,
      encryptionKeyConfigured,
      roundTripVerified: hashSecretConfigured && encryptionKeyConfigured,
    };
  } catch {
    return {
      hashSecretConfigured: false,
      encryptionKeyConfigured: false,
      roundTripVerified: false,
    };
  }
}
