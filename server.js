import express from "express";
import dotenv from "dotenv";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const API_BASE = (process.env.DRIP_API_BASE || "https://dripclientofficial.dev/api/v1").replace(/\/+$/, "");
const API_KEY = process.env.DRIP_API_KEY || "";
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

async function drip(pathname, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  const response = await fetch(`${API_BASE}${pathname}`, { ...options, headers });
  const raw = await response.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = { error: { message: "API mengembalikan respons yang tidak valid." } }; }
  if (!response.ok) {
    const err = new Error(body?.error?.message || `API error (${response.status})`);
    err.status = response.status;
    err.code = body?.error?.code;
    throw err;
  }
  return body;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(API_KEY), ordersEnabled: process.env.ALLOW_ORDERS === "true" });
});

app.get("/api/products", async (_req, res) => {
  try {
    const result = await drip("/products");
    res.set("Cache-Control", "public, max-age=30");
    res.json(result);
  } catch (e) {
    res.status(e.status || 502).json({ error: { message: e.message || "Gagal mengambil katalog produk." } });
  }
});

app.get("/api/balance", async (_req, res) => {
  if (!API_KEY) return res.status(503).json({ error: { message: "API key belum dipasang di server." } });
  try { res.json(await drip("/balance")); }
  catch (e) { res.status(e.status || 502).json({ error: { message: e.message } }); }
});

app.post("/api/orders", async (req, res) => {
  if (process.env.ALLOW_ORDERS !== "true") {
    return res.status(403).json({ error: { message: "Pembelian dinonaktifkan sampai konfigurasi dan API key diuji. Ubah ALLOW_ORDERS=true setelah siap." } });
  }
  if (!API_KEY) return res.status(503).json({ error: { message: "API key belum dipasang di server." } });
  const { sku, quantity } = req.body || {};
  if (typeof sku !== "string" || sku.length < 1 || sku.length > 200) {
    return res.status(400).json({ error: { message: "SKU produk tidak valid." } });
  }
  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
    return res.status(400).json({ error: { message: "Jumlah harus 1–50." } });
  }
  try {
    // Never accept price from the browser. Provider calculates price from its own catalog.
    const result = await drip("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID()
      },
      body: JSON.stringify({ sku, quantity: qty })
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 502).json({ error: { message: e.message, code: e.code } });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: { message: "API key belum dipasang di server." } });
  const id = String(req.params.id || "");
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) return res.status(400).json({ error: { message: "ID pesanan tidak valid." } });
  try { res.json(await drip(`/orders/${encodeURIComponent(id)}`)); }
  catch (e) { res.status(e.status || 502).json({ error: { message: e.message } }); }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`IKY STORE running on http://localhost:${PORT}`));
