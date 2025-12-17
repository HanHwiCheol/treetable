"use client";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import { useTreetable } from "@/hooks/useTreetable";
import { Toolbar } from "@/components/treetable/Toolbar";
import { TreeGrid } from "@/components/treetable/TreeGrid";

import { NodeRow } from "@/types/treetable";
import { rowsFromXlsx } from "@/utils/xlsx";

import { supabase } from "@/lib/supabaseClient";
import { logUsageEvent } from "@/utils/logUsageEvent";
import { useScenarioStore } from "@/hooks/useScenarioStore";

import { saveAllNodes } from "@/services/treetableService";

export default function TreetableDetail() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // 로그인 세션 처리
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { id } = router.query;
  const treetable_id = Array.isArray(id) ? id[0] : id;

  // 시나리오 이름을 가져오지만, treetable에서는 자동 import를 하지 않음
  const scenario = useScenarioStore((s) => s.scenario);

  // 테이블 관리 훅
  const {
    materials,
    rows,
    setRows,
    loading,
    saving,
    importMode,
    setImportMode,
    onChangeCell,
    save,
  } = useTreetable(treetable_id, { ready: !!session });

  // ----------------------------------------
  // 사용자 수동 Import → 즉시 DB 저장
  // ----------------------------------------
  const onFile = async (file: File) => {
    if (!treetable_id) return;

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const imported = rowsFromXlsx(wb, treetable_id);

    // 화면 반영
    if (importMode === "replace") {
      setRows(imported);
    } else {
      setRows((prev) => [...prev, ...imported]);
    }

    // DB 저장
    await saveAllNodes(treetable_id, imported, importMode);

    // 4) treetable 페이지 진입
    router.reload();

    // 로그
    await logUsageEvent(scenario ?? "unknown", "EBOM Import + SAVE", {
      treetable_id,
      importMode,
    });
  };

  if (!treetable_id) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "40px auto", padding: 16 }}>
        <h2>BOM Table</h2>
        <p>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>BOM Table</h1>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Toolbar
          onBack={() => router.push("/")}
          onSave={save}
          saving={saving}
          importMode={importMode}
          setImportMode={setImportMode}
          onFile={onFile}
          rows={rows as NodeRow[]}
          treetable_id={treetable_id}
        />
      </div>

      {/* Tree Grid */}
      <TreeGrid
        rows={rows as NodeRow[]}
        onChangeCell={onChangeCell}
        materials={materials}
      />
    </div>
  );
}
