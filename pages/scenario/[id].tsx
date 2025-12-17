"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { rowsFromXlsx } from "@/utils/xlsx";
import { saveAllNodes } from "@/services/treetableService";
import { supabase } from "@/lib/supabaseClient";
import { logUsageEvent } from "@/utils/logUsageEvent";
import { useScenarioStore } from "@/hooks/useScenarioStore";

export default function ScenarioLoaderPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scenario = useScenarioStore((s) => s.scenario) as
    | "material-change"
    | "size-change"
    | "structure-change";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setLoading(true);

        // 로그인 확인
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) {
          router.replace("/login");
          return;
        }
        if (cancelled) return;

        // 1) treetable 생성
        const autoName =
          `Scenario-${id}-` +
          new Date().toISOString().slice(0, 19).replace(/[:T]/g, "");

        const { data, error: rpcError } = await supabase.rpc(
          "create_treetable",
          { p_name: autoName }
        );
        if (rpcError) throw rpcError;

        const treetableId = data?.id;
        if (!treetableId) throw new Error("treetable ID 없음");

        // 2) 시나리오별 XLSX 선택
        let path: string | null = null;
        if (id === "material-change")
          path = "/scenario/material-change.xlsx";
        else if (id === "size-change")
          path = "/scenario/size-change.xlsx";
        else if (id === "structure-change")
          path = "/scenario/structure-change.xlsx";

        if (path) {
          // 2-1) XLSX 읽기
          const res = await fetch(path, { cache: "no-cache" });
          const buf = await res.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });

          // 2-2) rows 생성
          const imported = rowsFromXlsx(wb, treetableId);

          // 2-3) DB 저장
          await saveAllNodes(treetableId, imported, "replace");
        }

        // 3) 로그 기록
        await logUsageEvent(scenario, "Create Table + Scenario Import", {
          scenario: id,
          treetable_id: treetableId,
        });

        // 4) treetable 페이지 진입
        router.replace(`/treetable/${treetableId}`);
      } catch (e: any) {
        setError(e?.message ?? "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading)
    return <div style={{ padding: 40 }}>시나리오 테이블 생성 및 Import 중...</div>;

  if (error)
    return <div style={{ padding: 40, color: "red" }}>오류: {error}</div>;

  return null;
}
