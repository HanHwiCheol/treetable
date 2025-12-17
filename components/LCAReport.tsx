// components/LCAReport.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useRouter } from "next/router";
import { logUsageEvent } from "@/utils/logUsageEvent";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import { useScenarioStore } from "@/hooks/useScenarioStore";

console.log("LCAReport.tsx loaded");

// 시나리오별 탄소 한계값
const thresholds = {
    "material-change": 4.37,
    "size-change": 19.78,
    "structure-change": 36.25,
} as const;

type Item = {
  material: string;
  material_label: string;
  mass_kg: number;
  ef_kgco2e_perkg: number;
  carbon_kgco2e: number;
};

type Resp = {
  tableId: string;
  totals: { mass_kg: number; carbon_kgco2e: number };
  items: Item[];
};

export default function LCAReport({ tableId }: { tableId: string }) {
  console.log("LCAReport component render start");

  /** 🔥🔥🔥 핵심 수정: 훅을 컴포넌트 내부로 이동 */
  const scenario = useScenarioStore((s) => s.scenario) as
    | "material-change"
    | "size-change"
    | "structure-change"
    | null;

  const threshold =
    scenario && thresholds[scenario] ? thresholds[scenario] : 1.5;

  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /** ───────────────────────────────
   * 📌 데이터 로딩
   * ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/reports/${encodeURIComponent(tableId)}`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error(await r.text());
        setData(await r.json());
      } catch (e: unknown) {
        if (e instanceof Error) {
          setErr(e.message ?? "fetch error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [tableId]);

  /** ───────────────────────────────
   * 📌 파이차트 데이터
   * ─────────────────────────────── */
  const pieData = useMemo(() => {
    if (!data) return [];
    const totalC = data.totals.carbon_kgco2e || 0;

    const filtered = data.items.filter(
      (it) =>
        it.material &&
        !["no material", "assembly", "none"].includes(
          it.material.toLowerCase()
        )
    );

    return filtered.map((it) => {
      const val = Number((it.carbon_kgco2e ?? 0).toFixed(6));
      const pct = totalC ? (val / totalC) * 100 : 0;
      return { name: it.material_label, value: val, pct };
    });
  }, [data]);

  /** ───────────────────────────────
   * 📌 막대차트 데이터
   * ─────────────────────────────── */
  const barData = useMemo(() => {
    if (!data) return [];

    const filtered = data.items.filter(
      (it) =>
        it.material &&
        !["no material", "assembly", "none"].includes(
          it.material.toLowerCase()
        )
    );

    return filtered.map((it) => ({
      material: it.material_label,
      mass_kg: Number((it.mass_kg ?? 0).toFixed(6)),
      carbon_kgco2e: Number((it.carbon_kgco2e ?? 0).toFixed(6)),
    }));
  }, [data]);

  const colors = ["#000000", "#404040", "#808080"];

  /** ───────────────────────────────
   * CSV 다운로드
   * ─────────────────────────────── */
  const handleCSV = async () => {
    if (!data) return;

    const totalC = data.totals.carbon_kgco2e || 0;
    const rows = [
      [
        "material",
        "mass_kg",
        "ef_kgco2e_perkg",
        "carbon_kgco2e",
        "carbon_share_percent",
      ],
      ...data.items.map((it) => [
        it.material_label,
        (it.mass_kg ?? 0).toFixed(6),
        (it.ef_kgco2e_perkg ?? 0).toFixed(6),
        (it.carbon_kgco2e ?? 0).toFixed(6),
        totalC
          ? ((it.carbon_kgco2e ?? 0) / totalC * 100).toFixed(2)
          : "0.00",
      ]),
      [
        "TOTAL",
        data.totals.mass_kg.toFixed(6),
        "-",
        data.totals.carbon_kgco2e.toFixed(6),
        "100.00",
      ],
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lca_material_carbon_${tableId}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    await logUsageEvent(scenario ?? "unknown", "Export CSV", {});
  };

  /** ───────────────────────────────
   * 뒤로가기
   * ─────────────────────────────── */
  const handleBack = async () => {
    await logUsageEvent(scenario ?? "unknown", "Go back", {});
    router.push(`/treetable/${tableId}`);
  };

  /** ───────────────────────────────
   * 상태별 UI 출력
   * ─────────────────────────────── */
  if (loading) return <div style={{ padding: 16 }}>로딩중…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>에러: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>데이터 없음</div>;

  /** ───────────────────────────────
   * 리포트 UI
   * ─────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid #eee",
          paddingBottom: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>LCA 탄소 리포트</h1>
          <div style={{ color: "#666", fontSize: 13 }}>
            Table ID: <code>{data.tableId}</code>
            {" · 총중량 "}
            <b>{data.totals.mass_kg.toFixed(6)} kg</b>
            {" · 총탄소 "}
            <b>{data.totals.carbon_kgco2e.toFixed(6)} kgCO₂e</b>
          </div>
        </div>

        <div className="print-hide" style={{ display: "flex", gap: 8 }}>
          <button onClick={handleBack}>이전으로</button>
          <button onClick={handleCSV}>CSV</button>
          <button onClick={() => window.print()}>인쇄/PDF</button>
        </div>
      </header>

      <div
        ref={chartRef}
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1fr 1fr",
          marginTop: 16,
        }}
      >
        {/* 파이차트 */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>재질별 탄소 비중 (파이)</h3>
          <PieChart width={460} height={340}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {pieData.map((_e, i) => (
                <Cell key={i} />
              ))}
            </Pie>
            <ReTooltip
              formatter={(value: number, _name: string, props: Payload<number, string>) => {
                const p = props.payload as { pct: number; name: string; value: number };
                return [`${value} kgCO₂e (${p.pct.toFixed(2)}%)`, p.name];
              }}
            />
            <Legend />
          </PieChart>
        </div>

        {/* 막대차트 */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>재질별 중량/탄소 (막대)</h3>
          <BarChart width={520} height={340} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="material" />
            <YAxis />
            <ReTooltip
              formatter={(v: number, n: string) =>
                n === "중량(kg)" ? [`${v} kg`, "중량"] : [`${v} kgCO₂e`, "탄소"]
              }
            />
            <Legend />

            <Bar dataKey="mass_kg" name="중량(kg)">
              {barData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>

            <Bar dataKey="carbon_kgco2e" name="탄소(kgCO₂e)">
              {barData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>

      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginTop: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>해석 노트</h3>
        <ul style={{ marginTop: 8 }}>
          <li>
            재질별 탄소(kgCO₂e)는 <code>총질량(kg) × 배출계수(kgCO₂e/kg)</code>로 계산.
          </li>
          <li>목표 탄소량 (10% 감량) {threshold} kgCO₂e</li>
        </ul>
      </section>

      <style jsx>{`
        .print-hide {
          display: flex;
        }
        @media print {
          .print-hide {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
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
