import { Router, type Request, type Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { db } from "@workspace/db";
import {
  vehiclesTable,
  gigTasksTable,
  watchlistTable,
  notificationsTable,
  inspectionsTable,
  specialistApplicationsTable,
  auditLogsTable,
} from "@workspace/db";
import { sql, eq, ilike, or } from "drizzle-orm";

const router = Router();

function createMcpServer() {
  const server = new Server(
    { name: "3c-onyx-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "search_vehicles",
        description: "Search luxury vehicles in the 3C Onyx inventory and marketplace by make, model, or keyword",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term — make, model, or keyword (e.g. 'Rolls-Royce', 'Ferrari', 'SUV')" },
            maxResults: { type: "number", description: "Max results to return (default 5)" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_garage",
        description: "Retrieve the client's linked garage vehicles with telematics data (odometer, fuel, status)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_watchlist",
        description: "Get vehicles the client is watching with their target prices and current price gaps",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_notifications",
        description: "Fetch recent platform notifications for the client (deliveries, BGC status, price alerts, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            unreadOnly: { type: "boolean", description: "Return only unread notifications" },
          },
        },
      },
      {
        name: "get_gig_tasks",
        description: "List available or active gig tasks — deliveries, inspections, transport jobs for Runners",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", description: "Filter by status: Open, Claimed, In Progress, Completed" },
          },
        },
      },
      {
        name: "book_runner",
        description: "Book a Runner to transport or service a vehicle. Creates a gig task and sends a notification.",
        inputSchema: {
          type: "object",
          properties: {
            vehicleLabel: { type: "string", description: "Vehicle description (e.g. '2022 Rolls-Royce Ghost')" },
            taskType: { type: "string", description: "Type of task: Delivery | Transport | Inspection | Concierge" },
            pickupLocation: { type: "string", description: "Pickup address or location" },
            dropoffLocation: { type: "string", description: "Destination address or location" },
            notes: { type: "string", description: "Any additional notes for the Runner" },
          },
          required: ["vehicleLabel", "taskType"],
        },
      },
      {
        name: "get_analytics",
        description: "Get platform revenue analytics summary — GMV, Member Slice, delivery stats, BGC metrics",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_inspections",
        description: "Retrieve recent vehicle inspection reports with condition scores",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max number of inspections to return (default 5)" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_vehicles": {
          const q = (args?.query as string) || "";
          const max = (args?.maxResults as number) || 5;
          const results = await db
            .select()
            .from(vehiclesTable)
            .where(
              or(
                ilike(vehiclesTable.make, `%${q}%`),
                ilike(vehiclesTable.model, `%${q}%`),
                ilike(vehiclesTable.color, `%${q}%`)
              )
            )
            .limit(max);

          if (results.length === 0) {
            return {
              content: [{ type: "text", text: `No vehicles found matching "${q}" in inventory. The MarketCheck marketplace has live listings — try browsing there for real-time options.` }],
            };
          }

          const list = results
            .map((v) => `• ${v.year} ${v.make} ${v.model} — ${v.color} — $${Number(v.priceUsd).toLocaleString()} — Status: ${v.status} (VIN ****${v.vin.slice(-4)})`)
            .join("\n");

          return {
            content: [{ type: "text", text: `Found ${results.length} vehicle(s) matching "${q}":\n\n${list}` }],
          };
        }

        case "get_garage": {
          const vehicles = await db.select().from(vehiclesTable).limit(10);
          if (vehicles.length === 0) {
            return { content: [{ type: "text", text: "No vehicles currently linked in the client's garage." }] };
          }
          const list = vehicles
            .map((v) => `• ${v.year} ${v.make} ${v.model} (${v.color}) — VIN ****${v.vin.slice(-4)} — Status: ${v.status} — $${Number(v.priceUsd).toLocaleString()}`)
            .join("\n");
          return { content: [{ type: "text", text: `Garage vehicles (${vehicles.length} linked):\n\n${list}` }] };
        }

        case "get_watchlist": {
          const items = await db.select().from(watchlistTable).orderBy(watchlistTable.createdAt).limit(10);
          if (items.length === 0) {
            return { content: [{ type: "text", text: "No vehicles on the watchlist yet. Add vehicles from the Marketplace." }] };
          }
          const list = items
            .map((w) => {
              const gap = Number(w.listedPrice) - Number(w.targetPrice);
              const dir = gap > 0 ? `$${gap.toLocaleString()} above target` : `$${Math.abs(gap).toLocaleString()} below target — ALERT`;
              return `• ${w.year} ${w.make} ${w.model} — Listed: $${Number(w.listedPrice).toLocaleString()} | Target: $${Number(w.targetPrice).toLocaleString()} | ${dir}`;
            })
            .join("\n");
          return { content: [{ type: "text", text: `Watchlist (${items.length} vehicles):\n\n${list}` }] };
        }

        case "get_notifications": {
          const unreadOnly = args?.unreadOnly as boolean;
          const rows = await db
            .select()
            .from(notificationsTable)
            .orderBy(notificationsTable.createdAt)
            .limit(8);
          const filtered = unreadOnly ? rows.filter((n) => !n.read) : rows;
          if (filtered.length === 0) {
            return { content: [{ type: "text", text: "No notifications at this time." }] };
          }
          const list = filtered
            .map((n) => `• [${n.type}] ${n.title}: ${n.body} — ${n.read ? "Read" : "UNREAD"}`)
            .join("\n");
          return { content: [{ type: "text", text: `Recent notifications (${filtered.length}):\n\n${list}` }] };
        }

        case "get_gig_tasks": {
          const statusFilter = args?.status as string | undefined;
          const tasks = await db
            .select()
            .from(gigTasksTable)
            .limit(10);
          const filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
          if (filtered.length === 0) {
            return { content: [{ type: "text", text: `No gig tasks found${statusFilter ? ` with status "${statusFilter}"` : ""}.` }] };
          }
          const list = filtered
            .map((t) => `• [${t.status}] ${t.title} — ${t.taskType} — Payout: $${Number(t.payoutUsd).toLocaleString()}`)
            .join("\n");
          return { content: [{ type: "text", text: `Gig tasks (${filtered.length}):\n\n${list}` }] };
        }

        case "book_runner": {
          const vehicleLabel = (args?.vehicleLabel as string) || "Vehicle";
          const taskType = (args?.taskType as string) || "Transport";
          const pickup = (args?.pickupLocation as string) || "Client location";
          const dropoff = (args?.dropoffLocation as string) || "Destination";
          const notes = (args?.notes as string) || "";

          const title = `${taskType}: ${vehicleLabel} — ${pickup} → ${dropoff}`;

          const [task] = await db
            .insert(gigTasksTable)
            .values({
              title,
              taskType: taskType as any,
              status: "Open",
              payoutUsd: "850.00",
            })
            .returning();

          await db.insert(notificationsTable).values({
            type: "DELIVERY",
            title: "Runner Booked",
            body: `A Runner has been assigned for your ${vehicleLabel}. Task #T-${String(task.id).padStart(4, "0")} is now Open.${notes ? " Note: " + notes : ""}`,
            read: false,
          });

          return {
            content: [
              {
                type: "text",
                text: `Runner booked successfully. Task #T-${String(task.id).padStart(4, "0")} created for ${vehicleLabel} (${taskType}). Pickup: ${pickup} → Dropoff: ${dropoff}. A notification has been sent. You can track progress on the Logistics page.`,
              },
            ],
          };
        }

        case "get_analytics": {
          const [taskStats, bgcStats, auditStats] = await Promise.all([
            db.select({
              total: sql<number>`count(*)::int`,
              completed: sql<number>`count(*) filter (where status = 'Completed')::int`,
              totalPayout: sql<number>`coalesce(sum(payout_usd::numeric), 0)::float`,
            }).from(gigTasksTable),
            db.select({
              total: sql<number>`count(*)::int`,
              cleared: sql<number>`count(*) filter (where bgc_status = 'clear')::int`,
            }).from(specialistApplicationsTable),
            db.select({ critCount: sql<number>`count(*) filter (where severity = 'CRIT')::int` }).from(auditLogsTable),
          ]);

          const t = taskStats[0];
          const bgc = bgcStats[0];
          const gmv = t.totalPayout;
          const slice = gmv * 0.05;

          return {
            content: [
              {
                type: "text",
                text: `Platform Analytics Summary:\n• GMV: $${Math.round(gmv).toLocaleString()}\n• Member Slice (5%): $${Math.round(slice).toLocaleString()}\n• Total Tasks: ${t.total} (${t.completed} completed)\n• BGC Applications: ${bgc.total} (${bgc.cleared} cleared, ${bgc.total > 0 ? Math.round(bgc.cleared / bgc.total * 100) : 0}% clear rate)\n• Critical SOC2 Events: ${auditStats[0].critCount}`,
              },
            ],
          };
        }

        case "get_inspections": {
          const limit = (args?.limit as number) || 5;
          const rows = await db
            .select()
            .from(inspectionsTable)
            .orderBy(inspectionsTable.createdAt)
            .limit(limit);

          if (rows.length === 0) {
            return { content: [{ type: "text", text: "No inspection reports on file." }] };
          }

          const list = rows
            .map((ins) => {
              const scores = [ins.conditionFront, ins.conditionRear, ins.conditionDriverSide, ins.conditionPassengerSide, ins.conditionInterior];
              const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
              return `• ${ins.vehicleLabel} — Inspector: ${ins.inspectorName} — Avg Condition: ${avg}/10 — Signed: ${ins.signed ? "Yes" : "No"}`;
            })
            .join("\n");

          return { content: [{ type: "text", text: `Recent inspections (${rows.length}):\n\n${list}` }] };
        }

        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Tool error: ${msg}` }], isError: true };
    }
  });

  return server;
}

router.post("/mcp", async (req: Request, res: Response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

router.get("/mcp", async (req: Request, res: Response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

router.delete("/mcp", async (req: Request, res: Response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

router.get("/mcp/tools", async (_req: Request, res: Response) => {
  res.json({
    server: "3c-onyx-mcp",
    version: "1.0.0",
    tools: [
      { name: "search_vehicles", description: "Search luxury vehicles in inventory by make, model, or keyword" },
      { name: "get_garage", description: "Retrieve client's linked garage vehicles with telematics" },
      { name: "get_watchlist", description: "Get watched vehicles with target prices and price gaps" },
      { name: "get_notifications", description: "Fetch recent platform notifications" },
      { name: "get_gig_tasks", description: "List available or active gig tasks for Runners" },
      { name: "book_runner", description: "Book a Runner to transport or service a vehicle" },
      { name: "get_analytics", description: "Get platform revenue analytics summary" },
      { name: "get_inspections", description: "Retrieve recent vehicle inspection reports" },
    ],
  });
});

export default router;
