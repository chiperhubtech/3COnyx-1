import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeInputs } from "../middlewares/sanitize";

function createReq(overrides: Record<string, unknown> = {}) {
  return {
    path: "/api/test",
    body: {},
    query: {},
    ...overrides,
  } as any;
}

function createRes() {
  return {} as any;
}

describe("sanitizeInputs", () => {
  const next = vi.fn();

  beforeEach(() => {
    next.mockClear();
  });

  describe("XSS payloads stripped", () => {
    it("strips <script> tags", () => {
      const req = createReq({ body: { name: '<script>alert("xss")</script>Hello' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.name).not.toContain("<script>");
      expect(req.body.name).toContain("Hello");
      expect(next).toHaveBeenCalled();
    });

    it("strips <iframe> tags", () => {
      const req = createReq({ body: { html: '<iframe src="evil.com"></iframe>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.html).not.toContain("<iframe");
    });

    it("strips <img> tags with onerror", () => {
      const req = createReq({ body: { img: '<img src=x onerror=alert(1)>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.img).not.toContain("<img");
    });

    it("strips on-event handlers", () => {
      const req = createReq({ body: { text: 'click me onclick=steal()' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.text).not.toContain("onclick=");
    });

    it("strips javascript: protocol", () => {
      const req = createReq({ body: { url: "javascript:alert(1)" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.url).not.toContain("javascript:");
    });

    it("strips data: protocol", () => {
      const req = createReq({ body: { src: "data:text/html,<script>alert(1)</script>" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.src).not.toContain("data:");
    });

    it("strips <svg> tags", () => {
      const req = createReq({ body: { content: '<svg onload=alert(1)>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.content).not.toContain("<svg");
    });

    it("strips <object> tags", () => {
      const req = createReq({ body: { x: '<object data="evil.swf"></object>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<object");
    });

    it("strips <embed> tags", () => {
      const req = createReq({ body: { x: '<embed src="evil.swf">' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<embed");
    });

    it("strips <form> tags", () => {
      const req = createReq({ body: { x: '<form action="evil.com">' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<form");
    });

    it("strips <link> tags", () => {
      const req = createReq({ body: { x: '<link rel="stylesheet" href="evil.css">' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<link");
    });

    it("strips <meta> tags", () => {
      const req = createReq({ body: { x: '<meta http-equiv="refresh" content="0;url=evil.com">' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<meta");
    });

    it("strips <base> tags", () => {
      const req = createReq({ body: { x: '<base href="evil.com">' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<base");
    });

    it("strips <style> tags", () => {
      const req = createReq({ body: { x: '<style>body{background:url(evil)}</style>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.x).not.toContain("<style");
    });
  });

  describe("SQL injection patterns caught", () => {
    it("strips single-quote based injection", () => {
      const req = createReq({ body: { name: "'; DROP TABLE users;--" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.name).not.toMatch(/drop\s+table/i);
    });

    it("strips comment-based injection", () => {
      const req = createReq({ body: { name: "admin--" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.name).not.toContain("--");
    });

    it("strips UNION SELECT injection", () => {
      const req = createReq({ body: { q: "1; UNION SELECT * FROM users" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.q).not.toMatch(/union\s+select/i);
    });

    it("strips DELETE injection", () => {
      const req = createReq({ body: { q: "'; DELETE FROM users;--" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.q).not.toMatch(/delete\s+from/i);
    });
  });

  describe("null bytes removed", () => {
    it("strips null bytes from strings", () => {
      const req = createReq({ body: { name: "test\x00value" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.name).toBe("testvalue");
    });

    it("strips multiple null bytes", () => {
      const req = createReq({ body: { data: "\x00\x00hello\x00" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.data).toBe("hello");
    });
  });

  describe("clean input passes through unchanged", () => {
    it("preserves normal text", () => {
      const req = createReq({ body: { name: "John Doe", email: "john@example.com" } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.name).toBe("John Doe");
      expect(req.body.email).toBe("john@example.com");
    });

    it("preserves numbers", () => {
      const req = createReq({ body: { price: 99.99, qty: 5 } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.price).toBe(99.99);
      expect(req.body.qty).toBe(5);
    });

    it("preserves booleans", () => {
      const req = createReq({ body: { active: true } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.active).toBe(true);
    });

    it("preserves null values", () => {
      const req = createReq({ body: { middle: null } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.middle).toBeNull();
    });
  });

  describe("nested objects and arrays", () => {
    it("sanitizes nested objects", () => {
      const req = createReq({
        body: { user: { name: '<script>alert(1)</script>John' } },
      });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.user.name).not.toContain("<script>");
      expect(req.body.user.name).toContain("John");
    });

    it("sanitizes arrays", () => {
      const req = createReq({
        body: { tags: ['<script>x</script>', 'safe', '<img src=x>'] },
      });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.tags[0]).not.toContain("<script>");
      expect(req.body.tags[1]).toBe("safe");
    });
  });

  describe("query string sanitization", () => {
    it("sanitizes query parameters", () => {
      const req = createReq({ query: { search: '<script>alert(1)</script>' } });
      sanitizeInputs(req, createRes(), next);
      expect(req.query.search).not.toContain("<script>");
    });

    it("sanitizes array query parameters", () => {
      const req = createReq({ query: { ids: ['safe', '<img onerror=x>'] } });
      sanitizeInputs(req, createRes(), next);
      expect((req.query.ids as string[])[0]).toBe("safe");
    });
  });

  describe("webhook bypass", () => {
    it("skips sanitization for /webhooks paths", () => {
      const body = '<script>alert(1)</script>';
      const req = createReq({ path: "/webhooks/stripe", body: { raw: body } });
      sanitizeInputs(req, createRes(), next);
      expect(req.body.raw).toBe(body);
      expect(next).toHaveBeenCalled();
    });
  });
});
