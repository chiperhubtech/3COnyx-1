import crypto from "crypto";

const ARCHITECT = "Ronald Antonio Cadet";

export interface VaultObject {
  id: string;
  bucket: string;
  key: string;
  contentType: string;
  size: number;
  checksum: string;
  data: Buffer;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
  isPublic: boolean;
  owner?: string;
  tags: string[];
  version: number;
}

interface VaultBucket {
  name: string;
  createdAt: number;
  objectCount: number;
  totalSize: number;
  policy: BucketPolicy;
}

interface BucketPolicy {
  maxObjectSize: number;
  maxObjects: number;
  allowedTypes: string[];
  versioning: boolean;
  encryption: boolean;
  ttl?: number;
}

interface SignedUrlOptions {
  expiresIn: number;
  method: "GET" | "PUT";
}

interface CacheEntry {
  data: Buffer;
  contentType: string;
  etag: string;
  cachedAt: number;
  ttl: number;
  hits: number;
}

const DEFAULT_POLICY: BucketPolicy = {
  maxObjectSize: 50 * 1024 * 1024,
  maxObjects: 10000,
  allowedTypes: ["*"],
  versioning: false,
  encryption: true,
  ttl: undefined,
};

class OnyxObjectVault {
  private objects: Map<string, VaultObject> = new Map();
  private buckets: Map<string, VaultBucket> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private signedUrls: Map<string, { objectId: string; expiresAt: number; method: string }> = new Map();
  private readonly maxCacheSize = 100 * 1024 * 1024;
  private currentCacheSize = 0;
  private startedAt = Date.now();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  createBucket(name: string, policy?: Partial<BucketPolicy>): VaultBucket {
    if (this.buckets.has(name)) return this.buckets.get(name)!;
    const bucket: VaultBucket = {
      name,
      createdAt: Date.now(),
      objectCount: 0,
      totalSize: 0,
      policy: { ...DEFAULT_POLICY, ...policy },
    };
    this.buckets.set(name, bucket);
    return bucket;
  }

  putObject(bucket: string, key: string, data: Buffer | string, options?: {
    contentType?: string;
    metadata?: Record<string, string>;
    isPublic?: boolean;
    owner?: string;
    tags?: string[];
    expiresAt?: number;
  }): VaultObject {
    const b = this.buckets.get(bucket);
    if (!b) throw new Error(`Bucket '${bucket}' not found`);

    const buf = typeof data === "string" ? Buffer.from(data) : data;

    if (buf.length > b.policy.maxObjectSize) {
      throw new Error(`Object exceeds max size: ${buf.length} > ${b.policy.maxObjectSize}`);
    }

    if (b.objectCount >= b.policy.maxObjects) {
      throw new Error(`Bucket '${bucket}' has reached max object limit: ${b.policy.maxObjects}`);
    }

    const contentType = options?.contentType || this.detectContentType(key);
    if (b.policy.allowedTypes[0] !== "*") {
      const typeAllowed = b.policy.allowedTypes.some(allowed => {
        if (allowed.endsWith("/*")) {
          return contentType.startsWith(allowed.replace("/*", "/"));
        }
        return allowed === contentType;
      });
      if (!typeAllowed) {
        throw new Error(`Content type '${contentType}' not allowed in bucket '${bucket}'`);
      }
    }

    const objectId = `${bucket}/${key}`;
    const existing = this.objects.get(objectId);
    const checksum = crypto.createHash("sha256").update(buf).digest("hex");

    const obj: VaultObject = {
      id: objectId,
      bucket,
      key,
      contentType,
      size: buf.length,
      checksum,
      data: b.policy.encryption ? this.encrypt(buf) : buf,
      metadata: options?.metadata || {},
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      expiresAt: options?.expiresAt || (b.policy.ttl ? Date.now() + b.policy.ttl : undefined),
      accessCount: existing?.accessCount || 0,
      lastAccessed: Date.now(),
      isPublic: options?.isPublic || false,
      owner: options?.owner,
      tags: options?.tags || [],
      version: (existing?.version || 0) + 1,
    };

    if (existing) {
      b.totalSize -= existing.size;
    } else {
      b.objectCount++;
    }
    b.totalSize += buf.length;

    this.objects.set(objectId, obj);
    this.cache.delete(objectId);

    return { ...obj, data: buf };
  }

  getObject(bucket: string, key: string): { data: Buffer; contentType: string; metadata: Record<string, string>; checksum: string; size: number; etag: string } | null {
    const objectId = `${bucket}/${key}`;

    const cached = this.cache.get(objectId);
    if (cached && Date.now() - cached.cachedAt < cached.ttl) {
      cached.hits++;
      return { data: cached.data, contentType: cached.contentType, metadata: {}, checksum: "", size: cached.data.length, etag: cached.etag };
    }

    const obj = this.objects.get(objectId);
    if (!obj) return null;

    if (obj.expiresAt && Date.now() > obj.expiresAt) {
      this.deleteObject(bucket, key);
      return null;
    }

    obj.accessCount++;
    obj.lastAccessed = Date.now();

    const b = this.buckets.get(bucket);
    const decrypted = b?.policy.encryption ? this.decrypt(obj.data) : obj.data;
    const etag = `"${obj.checksum.substring(0, 16)}"`;

    if (decrypted.length < 5 * 1024 * 1024) {
      this.addToCache(objectId, decrypted, obj.contentType, etag);
    }

    return { data: decrypted, contentType: obj.contentType, metadata: obj.metadata, checksum: obj.checksum, size: obj.size, etag };
  }

  deleteObject(bucket: string, key: string): boolean {
    const objectId = `${bucket}/${key}`;
    const obj = this.objects.get(objectId);
    if (!obj) return false;

    const b = this.buckets.get(bucket);
    if (b) {
      b.objectCount--;
      b.totalSize -= obj.size;
    }

    this.objects.delete(objectId);
    this.cache.delete(objectId);
    return true;
  }

  listObjects(bucket: string, options?: { prefix?: string; limit?: number; offset?: number; sortBy?: "key" | "size" | "date" }): {
    objects: Array<{ key: string; size: number; contentType: string; updatedAt: number; checksum: string; isPublic: boolean; version: number }>;
    total: number;
  } {
    let results = Array.from(this.objects.values()).filter(o => o.bucket === bucket);

    if (options?.prefix) {
      results = results.filter(o => o.key.startsWith(options.prefix!));
    }

    if (options?.sortBy === "size") {
      results.sort((a, b) => b.size - a.size);
    } else if (options?.sortBy === "date") {
      results.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      results.sort((a, b) => a.key.localeCompare(b.key));
    }

    const total = results.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    const page = results.slice(offset, offset + limit);

    return {
      objects: page.map(o => ({
        key: o.key, size: o.size, contentType: o.contentType,
        updatedAt: o.updatedAt, checksum: o.checksum, isPublic: o.isPublic, version: o.version,
      })),
      total,
    };
  }

  generateSignedUrl(bucket: string, key: string, options: SignedUrlOptions): { url: string; expiresAt: number; token: string } {
    const objectId = `${bucket}/${key}`;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + options.expiresIn * 1000;

    this.signedUrls.set(token, { objectId, expiresAt, method: options.method });

    return {
      url: `/api/vault/signed/${token}`,
      expiresAt,
      token,
    };
  }

  validateSignedUrl(token: string, method: string): { valid: boolean; objectId?: string; reason?: string } {
    const entry = this.signedUrls.get(token);
    if (!entry) return { valid: false, reason: "Token not found" };
    if (Date.now() > entry.expiresAt) {
      this.signedUrls.delete(token);
      return { valid: false, reason: "Token expired" };
    }
    if (entry.method !== method) return { valid: false, reason: "Method mismatch" };
    return { valid: true, objectId: entry.objectId };
  }

  private addToCache(objectId: string, data: Buffer, contentType: string, etag: string): void {
    while (this.currentCacheSize + data.length > this.maxCacheSize && this.cache.size > 0) {
      let oldest: string | null = null;
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache) {
        if (entry.cachedAt < oldestTime) {
          oldestTime = entry.cachedAt;
          oldest = key;
        }
      }
      if (oldest) {
        const evicted = this.cache.get(oldest)!;
        this.currentCacheSize -= evicted.data.length;
        this.cache.delete(oldest);
      }
    }

    this.cache.set(objectId, { data, contentType, etag, cachedAt: Date.now(), ttl: 300000, hits: 0 });
    this.currentCacheSize += data.length;
  }

  private encrypt(data: Buffer): Buffer {
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "onyx-sovereign-vault-key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
  }

  private decrypt(data: Buffer): Buffer {
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "onyx-sovereign-vault-key", "salt", 32);
    const iv = data.subarray(0, 16);
    const encrypted = data.subarray(16);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private detectContentType(key: string): string {
    const ext = key.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
      pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      json: "application/json", xml: "application/xml", csv: "text/csv",
      txt: "text/plain", html: "text/html", css: "text/css", js: "application/javascript",
      mp4: "video/mp4", mp3: "audio/mpeg", wav: "audio/wav",
      zip: "application/zip", doc: "application/msword",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    return types[ext || ""] || "application/octet-stream";
  }

  getDashboard(): {
    architect: string;
    protocol: string;
    version: string;
    status: string;
    uptime: number;
    storage: {
      totalObjects: number;
      totalSize: number;
      totalSizeFormatted: string;
      bucketCount: number;
      cacheSize: number;
      cacheSizeFormatted: string;
      cacheHitRate: number;
      signedUrlsActive: number;
    };
    buckets: Array<{ name: string; objectCount: number; totalSize: number; totalSizeFormatted: string; policy: BucketPolicy }>;
    topObjects: Array<{ key: string; bucket: string; size: number; accessCount: number; contentType: string }>;
  } {
    const allObjects = Array.from(this.objects.values());
    const totalSize = allObjects.reduce((sum, o) => sum + o.size, 0);
    let totalHits = 0;
    let totalCacheEntries = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalCacheEntries++;
    }

    const bucketList = Array.from(this.buckets.values()).map(b => ({
      name: b.name,
      objectCount: b.objectCount,
      totalSize: b.totalSize,
      totalSizeFormatted: this.formatBytes(b.totalSize),
      policy: b.policy,
    }));

    const topObjects = allObjects
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(o => ({ key: o.key, bucket: o.bucket, size: o.size, accessCount: o.accessCount, contentType: o.contentType }));

    return {
      architect: ARCHITECT,
      protocol: "ONYX Object Vault",
      version: "1.0.0",
      status: "ARMED",
      uptime: Date.now() - this.startedAt,
      storage: {
        totalObjects: allObjects.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        bucketCount: this.buckets.size,
        cacheSize: this.currentCacheSize,
        cacheSizeFormatted: this.formatBytes(this.currentCacheSize),
        cacheHitRate: totalCacheEntries > 0 ? Number((totalHits / Math.max(totalHits + totalCacheEntries, 1) * 100).toFixed(1)) : 0,
        signedUrlsActive: this.signedUrls.size,
      },
      buckets: bucketList,
      topObjects,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  genesis(): void {
    this.createBucket("documents", { maxObjectSize: 25 * 1024 * 1024, allowedTypes: ["application/pdf", "application/msword", "text/plain"], encryption: true });
    this.createBucket("media", { maxObjectSize: 50 * 1024 * 1024, allowedTypes: ["image/*", "video/*", "audio/*"], encryption: false });
    this.createBucket("contracts", { maxObjectSize: 10 * 1024 * 1024, allowedTypes: ["application/pdf"], encryption: true, versioning: true });
    this.createBucket("exports", { maxObjectSize: 100 * 1024 * 1024, ttl: 7 * 24 * 60 * 60 * 1000, encryption: true });
    this.createBucket("system", { maxObjectSize: 5 * 1024 * 1024, encryption: true });

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, obj] of this.objects) {
        if (obj.expiresAt && now > obj.expiresAt) {
          this.deleteObject(obj.bucket, obj.key);
        }
      }
      for (const [token, entry] of this.signedUrls) {
        if (now > entry.expiresAt) this.signedUrls.delete(token);
      }
    }, 60000);

    console.log(`[ONYX OBJECT VAULT] 🗄️ S3-equivalent sovereign storage — 5 buckets, AES-256 encryption, CDN cache, signed URLs — Architect: ${ARCHITECT}`);
  }
}

export const objectVault = new OnyxObjectVault();
