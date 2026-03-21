import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const MARKETCHECK_BASE = "https://mc-api.marketcheck.com/v2";

router.get("/marketcheck/search", async (req: Request, res: Response) => {
  const apiKey = process.env.MARKETCHECK_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error: "MARKETCHECK_API_KEY is not configured",
      code: "MISSING_API_KEY",
    });
    return;
  }

  const {
    make,
    model,
    year,
    price_min,
    price_max,
    miles_max,
    zip,
    radius,
    rows = "20",
    start = "0",
    sort_by = "price",
    sort_order = "asc",
  } = req.query;

  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("rows", String(rows));
  params.set("start", String(start));
  params.set("sort_by", String(sort_by));
  params.set("sort_order", String(sort_order));
  params.set("car_type", "used");

  if (make) params.set("make", String(make));
  if (model) params.set("model", String(model));
  if (year) params.set("year", String(year));
  if (price_min) params.set("price_min", String(price_min));
  if (price_max) params.set("price_max", String(price_max));
  if (miles_max) params.set("miles_max", String(miles_max));
  if (zip) params.set("zip", String(zip));
  if (radius) params.set("radius", String(radius));

  try {
    const url = `${MARKETCHECK_BASE}/search/car/active?${params.toString()}`;
    req.log.info({ url: url.replace(apiKey, "***") }, "MarketCheck search request");

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      req.log.error({ status: response.status, body }, "MarketCheck API error");
      res.status(response.status).json({
        error: "MarketCheck API returned an error",
        status: response.status,
        detail: body,
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "MarketCheck fetch failed");
    res.status(500).json({ error: "Failed to reach MarketCheck API" });
  }
});

export default router;
