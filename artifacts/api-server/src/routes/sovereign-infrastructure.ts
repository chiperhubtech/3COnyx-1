import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { serviceMesh } from "../lib/sovereignServiceMesh";
import { metricsEngine } from "../lib/onyxMetricsEngine";
import { logAggregator } from "../lib/onyxLogAggregator";
import { objectVault } from "../lib/onyxObjectVault";
import { ciPipeline } from "../lib/onyxCIPipeline";

const router = Router();
const ARCHITECT = "Ronald Antonio Cadet";

router.get("/infrastructure/status", (_req: Request, res: Response) => {
  res.json({
    architect: ARCHITECT,
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "Sovereign Infrastructure Grid",
    version: "1.0.0",
    status: "ARMED",
    systems: {
      serviceMesh: { status: "ARMED", protocol: "Sovereign Service Mesh (Kubernetes-equivalent)" },
      metricsEngine: { status: "ARMED", protocol: "ONYX Metrics Engine (Prometheus+Grafana-equivalent)" },
      logAggregator: { status: "ARMED", protocol: "ONYX Log Aggregator (ELK Stack-equivalent)" },
      objectVault: { status: "ARMED", protocol: "ONYX Object Vault (S3+CloudFront-equivalent)" },
      ciPipeline: { status: "ARMED", protocol: "ONYX CI/CD Pipeline (GitHub Actions-equivalent)" },
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/infrastructure/mesh", requireAuth, (_req: Request, res: Response) => {
  res.json(serviceMesh.getClusterStatus());
});

router.get("/infrastructure/mesh/service/:name", requireAuth, (req: Request, res: Response) => {
  const service = serviceMesh.getService(req.params.name);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.get("/infrastructure/metrics", requireAuth, (_req: Request, res: Response) => {
  res.json(metricsEngine.getDashboard());
});

router.get("/infrastructure/metrics/prometheus", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(metricsEngine.getPrometheusFormat());
});

router.get("/infrastructure/logs", requireAuth, (req: Request, res: Response) => {
  const q: any = {};
  if (req.query.level) q.level = (req.query.level as string).split(",");
  if (req.query.service) q.service = req.query.service;
  if (req.query.search) q.search = req.query.search;
  if (req.query.correlationId) q.correlationId = req.query.correlationId;
  if (req.query.limit) q.limit = parseInt(req.query.limit as string, 10);
  if (req.query.offset) q.offset = parseInt(req.query.offset as string, 10);
  if (req.query.hasError) q.hasError = req.query.hasError === "true";
  if (req.query.minDuration) q.minDuration = parseInt(req.query.minDuration as string, 10);
  res.json(logAggregator.query(q));
});

router.get("/infrastructure/logs/dashboard", requireAuth, (_req: Request, res: Response) => {
  res.json(logAggregator.getDashboard());
});

router.get("/infrastructure/logs/trace/:correlationId", requireAuth, (req: Request, res: Response) => {
  const trace = logAggregator.getTrace(req.params.correlationId);
  res.json({ correlationId: req.params.correlationId, entries: trace, count: trace.length });
});

router.get("/infrastructure/logs/aggregate", requireAuth, (req: Request, res: Response) => {
  const window = req.query.window ? parseInt(req.query.window as string, 10) : undefined;
  res.json(logAggregator.aggregate(window));
});

router.get("/infrastructure/vault", requireAuth, (_req: Request, res: Response) => {
  res.json(objectVault.getDashboard());
});

router.get("/infrastructure/vault/:bucket", requireAuth, (req: Request, res: Response) => {
  const prefix = req.query.prefix as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
  const sortBy = req.query.sortBy as "key" | "size" | "date" | undefined;
  res.json(objectVault.listObjects(req.params.bucket, { prefix, limit, offset, sortBy }));
});

router.post("/infrastructure/vault/:bucket/upload", requireAuth, (req: Request, res: Response) => {
  try {
    const { key, data, contentType, metadata, isPublic, tags } = req.body || {};
    if (!key || !data) {
      res.status(400).json({ error: "key and data are required" });
      return;
    }
    const buf = Buffer.from(data, "base64");
    const obj = objectVault.putObject(req.params.bucket, key, buf, {
      contentType,
      metadata,
      isPublic,
      owner: String((req as any).user?.id || "unknown"),
      tags,
    });
    res.json({ id: obj.id, key: obj.key, size: obj.size, checksum: obj.checksum, version: obj.version });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/infrastructure/vault/:bucket/object/:key", requireAuth, (req: Request, res: Response) => {
  const obj = objectVault.getObject(req.params.bucket, req.params.key);
  if (!obj) {
    res.status(404).json({ error: "Object not found" });
    return;
  }

  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch === obj.etag) {
    res.status(304).end();
    return;
  }

  res.setHeader("Content-Type", obj.contentType);
  res.setHeader("Content-Length", obj.size.toString());
  res.setHeader("ETag", obj.etag);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("X-ONYX-Checksum", obj.checksum);
  res.send(obj.data);
});

router.post("/infrastructure/vault/:bucket/signed-url", requireAuth, (req: Request, res: Response) => {
  const { key, expiresIn, method } = req.body || {};
  if (!key) {
    res.status(400).json({ error: "key is required" });
    return;
  }
  const result = objectVault.generateSignedUrl(req.params.bucket, key, {
    expiresIn: typeof expiresIn === "number" ? expiresIn : 3600,
    method: method === "PUT" ? "PUT" : "GET",
  });
  res.json(result);
});

router.get("/vault/signed/:token", (req: Request, res: Response) => {
  const validation = objectVault.validateSignedUrl(req.params.token, "GET");
  if (!validation.valid || !validation.objectId) {
    res.status(403).json({ error: validation.reason || "Invalid signed URL" });
    return;
  }
  const [bucket, ...keyParts] = validation.objectId.split("/");
  const key = keyParts.join("/");
  const obj = objectVault.getObject(bucket, key);
  if (!obj) {
    res.status(404).json({ error: "Object not found" });
    return;
  }
  res.setHeader("Content-Type", obj.contentType);
  res.setHeader("Content-Length", obj.size.toString());
  res.setHeader("ETag", obj.etag);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(obj.data);
});

router.delete("/infrastructure/vault/:bucket/object/:key", requireAuth, (req: Request, res: Response) => {
  const deleted = objectVault.deleteObject(req.params.bucket, req.params.key);
  res.json({ deleted, bucket: req.params.bucket, key: req.params.key });
});

router.get("/infrastructure/pipeline", requireAuth, (_req: Request, res: Response) => {
  res.json(ciPipeline.getDashboard());
});

router.post("/infrastructure/pipeline/trigger", requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user || user.id !== 6) {
    res.status(403).json({ error: "Sovereign access required to trigger pipeline" });
    return;
  }
  ciPipeline.triggerPipeline(user.email || "sovereign", req.body?.branch || "main")
    .then(run => res.json({ triggered: true, runId: run.id, status: run.status }))
    .catch(err => res.status(409).json({ error: err.message }));
});

router.get("/infrastructure/pipeline/checks", requireAuth, (_req: Request, res: Response) => {
  res.json({ checks: ciPipeline.runDeploymentChecks(), architect: ARCHITECT });
});

export default router;
