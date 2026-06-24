// lib/db.ts —— Aurora PostgreSQL 连接池 + RLS 租户上下文注入
import { Pool, type PoolClient } from "pg";

// 连接池用 globalThis 缓存,防 serverless/HMR 反复 new 导致连接泄漏
const g = globalThis as unknown as { __wbPool?: Pool };

export function getPool(): Pool {
  if (!g.__wbPool) {
    g.__wbPool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      // Aurora 强制 SSL;hackathon 阶段先不校验 CA(P1 可换 RDS CA bundle)
      ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX ?? 3), // P0 直连,控制并发不打爆低 ACU
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 30_000, // Aurora 自动暂停唤醒/serverless 冷启动可能较慢
    });
  }
  return g.__wbPool;
}

// 登录前 / 参考数据查询(users / memberships / tenants / plans —— 这些表不开 RLS)
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

export interface ResolvedStore {
  tenantId: string;
  storeId: string;
  storeName: string;
  storeType: string;
  setupDone: boolean;
}

// 顾客自助(免登录)按公开 slug 解析门店:调 SECURITY DEFINER 函数(绕 RLS 只回单行)。
// 用普通 query()(aislely_app),函数内部以属主身份执行故能读到 stores。
export async function resolveStoreBySlug(slug: string): Promise<ResolvedStore | null> {
  const rows = await query<{
    tenant_id: string;
    store_id: string;
    store_name: string;
    store_type: string;
    setup_done: boolean;
  }>(
    "select tenant_id, store_id, store_name, store_type, setup_done from resolve_store_by_slug($1)",
    [slug]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    tenantId: r.tenant_id,
    storeId: r.store_id,
    storeName: r.store_name,
    storeType: r.store_type,
    setupDone: r.setup_done,
  };
}

export interface ResolvedInvite {
  tenantId: string;
  storeId: string | null;
  role: string;
  tenantName: string;
  storeName: string | null;
  expiresAt: string | null;
  usedAt: string | null;
}

// 店员注册前按邀请码解析门店(免会话):调 SECURITY DEFINER 函数绕 RLS。
export async function resolveInvite(code: string): Promise<ResolvedInvite | null> {
  const rows = await query<{
    tenant_id: string;
    store_id: string | null;
    role: string;
    tenant_name: string;
    store_name: string | null;
    expires_at: string | null;
    used_at: string | null;
  }>(
    "select tenant_id, store_id, role, tenant_name, store_name, expires_at, used_at from resolve_invite_by_code($1)",
    [code]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    tenantId: r.tenant_id,
    storeId: r.store_id,
    role: r.role,
    tenantName: r.tenant_name,
    storeName: r.store_name,
    expiresAt: r.expires_at,
    usedAt: r.used_at,
  };
}

// 带租户上下文的操作:同一事务内先设 GUC 再执行 → RLS 才会按 tenant 隔离。
// 关键:set_config 用 local=true 必须在同一事务内才持续,故这里显式 BEGIN/COMMIT;
// 归还连接时事务结束、GUC 自动清除,杜绝连接复用时串租户。
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback error */
    }
    throw err;
  } finally {
    client.release();
  }
}

// ── Signup → store bridge ────────────────────────────────────────────────
// When a Better Auth user is created, provision an Aislely tenant + store so
// the new owner immediately has a usable (empty) store keyed by tenant_id.
export interface ProvisionedStore {
  tenantId: string;
  slug: string;
}

function slugify(s: string): string {
  const base = (s || 'store')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  return base || 'store';
}

export async function provisionStore(ownerName: string): Promise<ProvisionedStore> {
  const displayName = ownerName ? `${ownerName}'s store` : 'My store';
  const rows = await query<{ id: string }>(
    'insert into tenants(name) values($1) returning id',
    [displayName]
  );
  const tenantId = rows[0].id;
  const slug = `${slugify(ownerName)}-${Math.random().toString(36).slice(2, 7)}`;
  await withTenant(tenantId, async (c) => {
    await c.query(
      "insert into stores(tenant_id,slug,name,type,setup_done) values($1,$2,$3,'custom',false)",
      [tenantId, slug, displayName]
    );
  });
  return { tenantId, slug };
}

// ── Load a public store's shelves (for the floor-plan map) ────────────────
export interface StoreShelf {
  id: string; code: string; kind: string;
  x: number; y: number; w: number; h: number;
  category: string | null; included: boolean; status: string;
}
export async function loadStoreShelves(
  slug: string
): Promise<{ store: ResolvedStore; shelves: StoreShelf[] } | null> {
  const store = await resolveStoreBySlug(slug);
  if (!store) return null;
  const shelves = await withTenant(store.tenantId, async (c) =>
    (
      await c.query<StoreShelf>(
        'select id, code, kind, x, y, w, h, category, included, status from shelves where store_id=$1 order by code',
        [store.storeId]
      )
    ).rows
  );
  return { store, shelves };
}
