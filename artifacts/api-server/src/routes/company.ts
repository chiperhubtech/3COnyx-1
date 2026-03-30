/**
 * 3C ONYX — Company Hub API Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Central endpoint for all CUXTOMCANDYCLUB LLC business infrastructure:
 *   - Domain status (Namecheap)
 *   - DNS records
 *   - Email forwards
 *   - Business entity info (Tailor Brands LLC)
 *   - Brand kit
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  getAllDomains, getDomainInfo, getDnsRecords,
  setDnsRecord, getEmailForwards, NAMECHEAP_DOMAINS,
} from "../lib/namecheap.js";
import { getSecret } from "../lib/secrets.js";
import { logger } from "../lib/logger.js";

export const companyRouter = Router();

companyRouter.use(requireAuth);

/**
 * GET /api/company/overview
 * Returns full company hub data: entity info, domains, email, brand kit
 */
companyRouter.get("/overview", async (req, res) => {
  try {
    const hasApiKey = !!(await getSecret("NAMECHEAP_API_KEY"));

    const domains = await getAllDomains();

    return res.json({
      entity: {
        name:        "Cuxtomcandyclub LLC",
        founder:     "Ronald Antonio Cadet (Ron3C)",
        formed:      "12/21/2025",
        state:       "New York",
        entityId:    "7788320",
        registrar:   "Tailor Brands × Namecheap",
        ein:         "••••••••",
        status:      "Active",
        services:    ["LLC Formation", "Registered Agent", "Operating Agreement", "Business Banking"],
        alerts: [
          {
            level:   "warning",
            title:   "Sales tax registration required",
            detail:  "Cuxtomcandyclub LLC is required to collect sales tax in New York. Register for a sales tax permit to avoid potential legal consequences & fines.",
            action:  "Register now",
            link:    "https://www.tax.ny.gov/bus/st/stidx.htm",
          },
          {
            level:   "warning",
            title:   "11 mandatory licenses & permits pending",
            detail:  "Cuxtomcandyclub LLC has not yet applied for 11 mandatory licenses and permits. Avoid financial penalties and legal consequences by completing these applications.",
            action:  "View in Tailor Brands",
            link:    "https://studio.tailorbrands.com",
          },
          {
            level:   "info",
            title:   "Registered agent documents arrived",
            detail:  "New registered agent documents are available. Download them from your Tailor Brands LLC Dashboard → Documents section.",
            action:  "Open LLC Dashboard",
            link:    "https://studio.tailorbrands.com",
          },
        ],
      },
      domains,
      apiConnected: hasApiKey,
      emails: {
        primary:    "ron@cuxtomcandyclub.ai",
        support:    "support@3conyx.com",
        hello:      "hello@3conyx.com",
        noreply:    "noreply@3conyx.com",
      },
      brandKit: {
        colors: [
          { name: "ONYX GOLD",   hex: "#C9A227", role: "Primary"   },
          { name: "GOLD LIGHT",  hex: "#E8B830", role: "Accent"    },
          { name: "ONYX BLACK",  hex: "#050505", role: "Background"},
          { name: "CARBON",      hex: "#0A0A12", role: "Surface"   },
          { name: "WHITE",       hex: "#FFFFFF", role: "Text"      },
          { name: "CREAM",       hex: "#EDE7DC", role: "Light BG"  },
          { name: "EMERALD",     hex: "#34D399", role: "Success"   },
          { name: "DANGER",      hex: "#EF4444", role: "Error"     },
        ],
        typography: [
          { name: "Barlow Condensed", role: "Display / Headings", weights: ["700", "900"] },
          { name: "Inter",            role: "Body / UI",           weights: ["400", "500", "600"] },
          { name: "JetBrains Mono",   role: "Code / Data",         weights: ["400", "700"] },
        ],
        logoVariants: ["gold", "white", "dark", "app-icon"],
      },
      dns: {
        onyxIp:         null,
        verifyTxt:      null,
        onyxDomain:     null,
        setupComplete:  false,
        note:           "Publish the platform first, then Replit generates the A record IP and TXT verification string.",
      },
    });
  } catch (err) {
    logger.error({ err }, "[company] overview error");
    return res.status(500).json({ error: "Failed to load company overview" });
  }
});

/**
 * GET /api/company/domains
 * List all owned domains with live Namecheap status
 */
companyRouter.get("/domains", async (_req, res) => {
  try {
    const domains = await getAllDomains();
    return res.json({ domains });
  } catch (err) {
    logger.error({ err }, "[company] domains error");
    return res.status(500).json({ error: "Failed to fetch domains" });
  }
});

/**
 * GET /api/company/domains/:domain/dns
 * Get DNS records for a domain
 */
companyRouter.get("/domains/:domain/dns", async (req, res) => {
  const { domain } = req.params;
  if (!NAMECHEAP_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Domain not in owned domains list" });
  }
  try {
    const records = await getDnsRecords(domain);
    return res.json({ domain, records });
  } catch (err) {
    logger.error({ err }, "[company] dns fetch error");
    return res.status(500).json({ error: "Failed to fetch DNS records" });
  }
});

/**
 * POST /api/company/domains/:domain/dns
 * Add or update a DNS record (Admin only — used by the DNS Wizard)
 */
companyRouter.post("/domains/:domain/dns", async (req, res) => {
  const { domain } = req.params;
  if (!NAMECHEAP_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Domain not in owned domains list" });
  }
  const { records } = req.body as { records: { type: string; host: string; value: string; ttl: number }[] };
  if (!records?.length) return res.status(400).json({ error: "records array required" });

  try {
    const success = await setDnsRecord(domain, records);
    return res.json({ success, domain });
  } catch (err) {
    logger.error({ err }, "[company] dns set error");
    return res.status(500).json({ error: "Failed to update DNS records" });
  }
});

/**
 * GET /api/company/domains/:domain/email
 * Get email forward accounts for a domain
 */
companyRouter.get("/domains/:domain/email", async (req, res) => {
  const { domain } = req.params;
  if (!NAMECHEAP_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Domain not in owned domains list" });
  }
  try {
    const accounts = await getEmailForwards(domain);
    return res.json({ domain, accounts });
  } catch (err) {
    logger.error({ err }, "[company] email fetch error");
    return res.status(500).json({ error: "Failed to fetch email accounts" });
  }
});
