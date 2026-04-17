import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { alertEngine } from "../lib/alertEngine";

const router: IRouter = Router();

router.get(
  "/admin/alerts",
  requireAuth,
  requireRole("Admin"),
  (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
    const history = alertEngine.getAlertHistory();
    const paginatedHistory = history.slice(offset, offset + limit);

    res.json({
      activeAlerts: alertEngine.getActiveAlerts(),
      activeCount: alertEngine.getActiveAlerts().length,
      history: paginatedHistory,
      historyTotal: history.length,
      historyOffset: offset,
      historyLimit: limit,
      hasMore: offset + limit < history.length,
      thresholds: alertEngine.getThresholds(),
      ts: new Date().toISOString(),
    });
  },
);

export default router;
