import { Router, type Request, type Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = Router();

interface PipelineStep {
  name: string;
  command: string;
  status: "pending" | "running" | "passed" | "failed";
  durationMs?: number;
  output?: string;
}

const PIPELINE_STEPS: Omit<PipelineStep, "status">[] = [
  { name: "typecheck", command: "pnpm run typecheck 2>&1 | tail -20" },
  { name: "build-api", command: "pnpm --filter @workspace/api-server run build 2>&1 | tail -20" },
  { name: "build-web", command: "pnpm --filter @workspace/3c-onyx run build 2>&1 | tail -20" },
];

let lastRunResult: {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "passed" | "failed";
  steps: PipelineStep[];
} | null = null;

let pipelineRunning = false;

router.get("/ci/status", (_req: Request, res: Response) => {
  res.json({
    pipeline: "3C Onyx — Security First CI",
    steps: PIPELINE_STEPS.map((s) => ({ name: s.name, command: s.command })),
    lastRun: lastRunResult,
    isRunning: pipelineRunning,
    deployment: {
      target: "autoscale",
      region: "us-east-1",
      buildCommand: "pnpm run build",
      runCommand: "node dist/index.cjs",
      healthCheck: "/api/health",
    },
  });
});

router.post("/ci/run", async (_req: Request, res: Response) => {
  if (pipelineRunning) {
    res.status(409).json({ error: "Pipeline already running" });
    return;
  }

  pipelineRunning = true;
  const runId = `run-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const steps: PipelineStep[] = PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" }));

  lastRunResult = {
    runId,
    startedAt,
    status: "running",
    steps,
  };

  res.json({ runId, startedAt, status: "running", message: "Pipeline started" });

  const pipelineStart = Date.now();
  let pipelineStatus: "passed" | "failed" = "passed";

  for (const step of steps) {
    step.status = "running";
    const t0 = Date.now();
    try {
      const { stdout, stderr } = await execAsync(step.command, {
        cwd: "/home/runner/workspace",
        timeout: 120000,
      });
      step.output = (stdout + stderr).slice(-1000);
      step.status = "passed";
    } catch (err: any) {
      step.output = (err.stdout || "" + err.stderr || err.message || "").slice(-1000);
      step.status = "failed";
      pipelineStatus = "failed";
    }
    step.durationMs = Date.now() - t0;
  }

  lastRunResult = {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - pipelineStart,
    status: pipelineStatus,
    steps,
  };
  pipelineRunning = false;
});

router.get("/ci/run/:runId", (req: Request, res: Response) => {
  if (!lastRunResult || lastRunResult.runId !== req.params.runId) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json(lastRunResult);
});

export default router;
