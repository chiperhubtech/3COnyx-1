/**
 * 3C ONYX — Namecheap API Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages CUXTOMCANDYCLUB LLC domains via Namecheap's XML API.
 * Gracefully falls back to static config when credentials are not set.
 *
 * Required secrets:
 *   NAMECHEAP_API_USER  — your Namecheap username
 *   NAMECHEAP_API_KEY   — API key from Profile → Tools → API Access
 *   NAMECHEAP_CLIENT_IP — whitelisted IP (add Replit deployment IP in Namecheap)
 */

import { getSecret } from "./secrets.js";
import { logger } from "./logger.js";

const NC_API_BASE = "https://api.namecheap.com/xml.response";

export interface DomainInfo {
  name: string;
  status: "active" | "expired" | "expiring_soon" | "unknown";
  expiresOn: string | null;
  createdOn: string | null;
  autoRenew: boolean;
  whoisGuard: boolean;
  nameservers: string[];
  isPremium: boolean;
}

export interface DnsRecord {
  type: string;
  host: string;
  value: string;
  ttl: number;
}

export interface EmailAccount {
  emailId: string;
  domain: string;
  address: string;
  forwardTo?: string;
  isForwarder: boolean;
}

const OWNED_DOMAINS = [
  "3conyx.com",
  "3conyx.ai",
  "cuxtomcandyclub.com",
  "cuxtomcandyclub.ai",
];

async function ncGet(command: string, params: Record<string, string> = {}): Promise<string | null> {
  const apiUser  = await getSecret("NAMECHEAP_API_USER");
  const apiKey   = await getSecret("NAMECHEAP_API_KEY");
  const clientIp = await getSecret("NAMECHEAP_CLIENT_IP");

  if (!apiUser || !apiKey || !clientIp) {
    logger.warn("[namecheap] credentials not configured — returning static data");
    return null;
  }

  const url = new URL(NC_API_BASE);
  url.searchParams.set("ApiUser",  apiUser);
  url.searchParams.set("ApiKey",   apiKey);
  url.searchParams.set("UserName", apiUser);
  url.searchParams.set("ClientIp", clientIp);
  url.searchParams.set("Command",  command);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Namecheap HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    logger.error({ err, command }, "[namecheap] API call failed");
    return null;
  }
}

function parseXmlValue(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"));
  return m?.[1]?.trim() ?? "";
}

function parseXmlAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i"));
  return m?.[1]?.trim() ?? "";
}

function staticDomainInfo(name: string): DomainInfo {
  return {
    name,
    status: "unknown",
    expiresOn: null,
    createdOn: "2025-12-01",
    autoRenew: true,
    whoisGuard: true,
    nameservers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"],
    isPremium: false,
  };
}

export async function getDomainInfo(domain: string): Promise<DomainInfo> {
  const [sld, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  const xml = await ncGet("namecheap.domains.getInfo", { DomainName: domain, HostName: sld });
  if (!xml) return staticDomainInfo(domain);

  try {
    const status    = parseXmlAttr(xml, "DomainGetInfoResult", "Status").toLowerCase();
    const created   = parseXmlValue(xml, "CreatedDate");
    const expires   = parseXmlValue(xml, "ExpiredDate");
    const autoRenew = parseXmlAttr(xml, "DomainDetails", "AutoRenew") === "true";
    const whois     = parseXmlAttr(xml, "Whoisguard", "Enabled") === "True";

    const nsMatches = [...xml.matchAll(/<Nameserver>([^<]+)<\/Nameserver>/gi)];
    const nameservers = nsMatches.map((m) => m[1].trim());

    let domainStatus: DomainInfo["status"] = "unknown";
    if (status === "ok" || status === "active") {
      if (expires) {
        const daysLeft = (new Date(expires).getTime() - Date.now()) / 86_400_000;
        domainStatus = daysLeft < 30 ? "expiring_soon" : "active";
      } else {
        domainStatus = "active";
      }
    } else if (status.includes("expir")) {
      domainStatus = "expired";
    }

    return { name: domain, status: domainStatus, expiresOn: expires || null, createdOn: created || "2025-12-01", autoRenew, whoisGuard: whois, nameservers: nameservers.length ? nameservers : ["dns1.registrar-servers.com", "dns2.registrar-servers.com"], isPremium: false };
  } catch {
    return staticDomainInfo(domain);
  }
}

export async function getAllDomains(): Promise<DomainInfo[]> {
  const xml = await ncGet("namecheap.domains.getList", { ListType: "ALL", PageSize: "50" });

  if (!xml) {
    return OWNED_DOMAINS.map(staticDomainInfo);
  }

  try {
    const domainMatches = [...xml.matchAll(/<Domain\s([^/]*?)\/>/gi)];
    if (!domainMatches.length) return OWNED_DOMAINS.map(staticDomainInfo);

    const results: DomainInfo[] = [];
    for (const m of domainMatches) {
      const attrs = m[1];
      const name     = attrs.match(/Name="([^"]+)"/i)?.[1] ?? "";
      const expires  = attrs.match(/Expires="([^"]+)"/i)?.[1] ?? null;
      const created  = attrs.match(/Created="([^"]+)"/i)?.[1] ?? null;
      const isExpired= attrs.match(/IsExpired="([^"]+)"/i)?.[1] === "true";
      const autoRenew= attrs.match(/AutoRenew="([^"]+)"/i)?.[1] === "true";
      const whois    = attrs.match(/WhoisGuard="([^"]+)"/i)?.[1]?.toUpperCase() === "ENABLED";

      if (!OWNED_DOMAINS.includes(name)) continue;

      let status: DomainInfo["status"] = "active";
      if (isExpired) status = "expired";
      else if (expires) {
        const days = (new Date(expires).getTime() - Date.now()) / 86_400_000;
        if (days < 30) status = "expiring_soon";
      }

      results.push({ name, status, expiresOn: expires, createdOn: created ?? "2025-12-01", autoRenew, whoisGuard: whois, nameservers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"], isPremium: false });
    }

    const missing = OWNED_DOMAINS.filter((d) => !results.find((r) => r.name === d));
    return [...results, ...missing.map(staticDomainInfo)];
  } catch {
    return OWNED_DOMAINS.map(staticDomainInfo);
  }
}

export async function getDnsRecords(domain: string): Promise<DnsRecord[]> {
  const [sld, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  const xml = await ncGet("namecheap.domains.dns.getHosts", { SLD: sld, TLD: tld });
  if (!xml) return [];

  try {
    const hostMatches = [...xml.matchAll(/<host\s([^/]*?)\/>/gi)];
    return hostMatches.map((m) => {
      const attrs = m[1];
      return {
        type:  attrs.match(/Type="([^"]+)"/i)?.[1] ?? "",
        host:  attrs.match(/Name="([^"]+)"/i)?.[1] ?? "@",
        value: attrs.match(/Address="([^"]+)"/i)?.[1] ?? "",
        ttl:   parseInt(attrs.match(/TTL="([^"]+)"/i)?.[1] ?? "1800", 10),
      };
    });
  } catch {
    return [];
  }
}

export async function setDnsRecord(domain: string, records: DnsRecord[]): Promise<boolean> {
  const [sld, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  const params: Record<string, string> = { SLD: sld, TLD: tld };
  records.forEach((r, i) => {
    params[`HostName${i + 1}`]   = r.host;
    params[`RecordType${i + 1}`] = r.type;
    params[`Address${i + 1}`]    = r.value;
    params[`TTL${i + 1}`]        = String(r.ttl);
  });

  const xml = await ncGet("namecheap.domains.dns.setHosts", params);
  if (!xml) return false;
  return xml.includes('IsSuccess="true"');
}

export async function getEmailForwards(domain: string): Promise<EmailAccount[]> {
  const [sld, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  const xml = await ncGet("namecheap.domains.dns.getEmailForwarding", { DomainName: domain });
  if (!xml) {
    return [
      { emailId: "ron",    domain, address: `ron@${domain}`,    forwardTo: "ron@cuxtomcandyclub.ai", isForwarder: true },
      { emailId: "hello",  domain, address: `hello@${domain}`,  forwardTo: "ron@cuxtomcandyclub.ai", isForwarder: true },
      { emailId: "support",domain, address: `support@${domain}`,forwardTo: "ron@cuxtomcandyclub.ai", isForwarder: true },
    ];
  }

  try {
    const fwdMatches = [...xml.matchAll(/<Forward\s([^/]*?)\/>/gi)];
    return fwdMatches.map((m) => {
      const attrs = m[1];
      const addr  = attrs.match(/MailBox="([^"]+)"/i)?.[1] ?? "";
      const fwd   = attrs.match(/ForwardTo="([^"]+)"/i)?.[1] ?? "";
      return { emailId: addr.split("@")[0], domain, address: addr, forwardTo: fwd, isForwarder: true };
    });
  } catch {
    return [];
  }
}

export const NAMECHEAP_DOMAINS = OWNED_DOMAINS;
