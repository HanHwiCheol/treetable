// pages/api/reports/[tableId].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const { tableId } = req.query as { tableId?: string };
  if (!tableId) return res.status(400).json({ error: "tableId is required" });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "app" } } // 여기서 스키마 명시
  );
  const { data, error } = await supabase
    .from("treetable_nodes") // ← 스키마에 맞게 바꿔
    .select("material_code, weight")
    .eq("treetable_id", tableId);

  if (error) return res.status(500).json({ error: error.message });

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const m = row.material_code ?? "Unknown";
    const w = Number(row.weight ?? 0);
    map.set(m, (map.get(m) ?? 0) + w);
  }

  const items = Array.from(map.entries())
    .map(([material, totalWeight]) => ({ material, totalWeight }))
    .sort((a, b) => b.totalWeight - a.totalWeight);

  const totalWeight = items.reduce((s, r) => s + r.totalWeight, 0);

  return res.status(200).json({ tableId, totalWeight, items });
}
