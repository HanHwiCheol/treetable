// components/LCAReport.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useRouter } from "next/router";

type Resp = {
  tableId: string;
  totalWeight: number;
  items: { material: string; totalWeight: number }[];
};


export default function LCAReport({ tableId }: { tableId: string }) {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/reports/${encodeURIComponent(tableId)}`, { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        setData(await r.json());
      } catch (e: any) {
        setErr(e?.message ?? "fetch error");
      } finally {
        setLoading(false);
      }
    })();
  }, [tableId]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.items.map(it => ({
      name: it.material,
      value: Number(it.totalWeight.toFixed(4)),
      pct: data.totalWeight ? (it.totalWeight / data.totalWeight) * 100 : 0,
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!data) return [];
    return data.items.map(it => ({
      material: it.material,
      weight_kg: Number(it.totalWeight.toFixed(4)),
    }));
  }, [data]);

  const handlePrint = () => window.print();
  const handleCSV = () => {
    if (!data) return;
    const rows = [
      ["material", "total_weight_kg", "share_percent"],
      ...pieData.map(d => [d.name, d.value.toString(), d.pct.toFixed(2)]),
      ["TOTAL", data.totalWeight.toFixed(4), "100.00"],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lca_material_share_${tableId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 16 }}>로딩중…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>에러: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #eee", paddingBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>LCA 재질 중량 리포트</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            Table ID: <code>{data.tableId}</code> · 총중량 <b>{data.totalWeight.toFixed(4)} kg</b>
          </div>
        </div>
        <div className="print-hide" style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/")}>목록으로</button>   {/* pages/index.tsx 로 */}
          <button onClick={handleCSV}>CSV</button>
          <button onClick={handlePrint}>인쇄/PDF</button>
        </div>
      </header>

      <div ref={chartRef} style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>재질 비중 (파이)</h3>
          <PieChart width={460} height={340}>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
              {pieData.map((_e, i) => <Cell key={i} />)}
            </Pie>
            <ReTooltip formatter={(v: any, _n, p: any) => [`${v} kg (${p.payload.pct.toFixed(2)}%)`, p.payload.name]} />
            <Legend />
          </PieChart>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>재질별 중량 (막대)</h3>
          <BarChart width={520} height={340} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="material" />
            <YAxis />
            <ReTooltip formatter={(v: any) => [`${v} kg`, "중량"]} />
            <Legend />
            <Bar dataKey="weight_kg" name="중량(kg)">
              {barData.map((_e, i) => <Cell key={i} />)}
            </Bar>
          </BarChart>
        </div>
      </div>

      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>해석 노트</h3>
        <ul style={{ marginTop: 8 }}>
          <li>재질별 중량 합계 기준 비중. (LCA의 Inventory 간이 확인)</li>
          <li>엄밀한 LCA에는 공정/에너지/수송 등 LCI 데이터 매핑이 필요.</li>
          <li>필요 시 재질 그룹/어셈블리 계층 합산으로 확장 가능.</li>
        </ul>
      </section>

      <style jsx>{`
        .print-hide { display: flex; }
        @media print {
          .print-hide { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        button {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: #f7f7f7;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
