"use client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useTreetable } from "@/hooks/useTreetable";
import { Toolbar } from "@/components/treetable/Toolbar";
import { TreeGrid } from "@/components/treetable/TreeGrid";
import { rowsFromXlsx } from "@/utils/xlsx";
import { NodeRow } from "@/types/treetable";
import { supabase } from "@/lib/supabaseClient";


export default function TreetableDetail() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { id } = router.query;
  const treetable_id = Array.isArray(id) ? id[0] : id;

  const {
    materials,            // ✅ 훅에서 받아온다
    rows, setRows,
    loading, saving,
    importMode, setImportMode,
    onChangeCell, save,
  } = useTreetable(treetable_id, { ready: !!session });

  const onFile = async (file: File) => {
    if (!treetable_id) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const imported = rowsFromXlsx(wb, treetable_id);

    if (importMode === "replace") setRows(imported);
    else setRows((prev) => [...prev, ...imported]);

    try {
      const { data: s, error: sErr } = await supabase.auth.getSession();
      if (sErr || !s.session) { alert("로그인 세션 없음"); return; }

      const email = s.session?.user?.email ?? null;
      const uid = s.session?.user?.id ?? null;

      const startAt = localStorage.getItem("prepStartAt");
      const durationMs = startAt
        ? Date.now() - new Date(startAt).getTime()
        : null;
      const { error } = await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: email,
        treetable_id: treetable_id,
        step: "EBOM",
        action: startAt ? "EBOM Import" : "success_no_prepmark",
        duration_ms: durationMs, // null이면 DB에 null 저장
        detail: {
          note: startAt
            ? "prep time from user mark to import success"
            : "no prepStartAt; logged at file import",
        },
      }]);
       
      if (error) {
        alert("usage_events insert 실패: " + error.message);
      } else if (startAt) {
        localStorage.removeItem("prepStartAt");
      }

    } catch (e) {
      console.error("log prep time failed", e);
    }
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

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {/* 왼쪽: Toolbar (Excel Import + 목록으로 + 저장하기) */}
        <Toolbar
          onBack={() => router.push("/")}
          onSave={save}
          saving={saving}
          importMode={importMode}
          setImportMode={setImportMode}
          onFile={onFile}
          rows={rows as NodeRow[]}
          treetable_id={treetable_id as string}
        />
      </div>

      <TreeGrid
        rows={rows as NodeRow[]}
        onChangeCell={onChangeCell}
        materials={materials}
      />
    </div>
  );
}
