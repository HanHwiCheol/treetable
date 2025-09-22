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
  const treetableId = Array.isArray(id) ? id[0] : id;

  const {
    materials,            // ✅ 훅에서 받아온다
    rows, setRows,
    loading, saving,
    importMode, setImportMode,
    onChangeCell, save,
  } = useTreetable(treetableId, { ready: !!session });

  const onFile = async (file: File) => {
    if (!treetableId) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const imported = rowsFromXlsx(wb, treetableId);

    if (importMode === "replace") setRows(imported);
    else setRows((prev) => [...prev, ...imported]);
  };

  if (!treetableId) return null;
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "40px auto", padding: 16 }}>
        <h2>TreeTable 편집</h2>
        <p>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>TreeTable 편집</h1>
      <Toolbar
        onBack={() => router.push("/")}
        onSave={save}
        saving={saving}
        importMode={importMode}
        setImportMode={setImportMode}
        onFile={onFile}
      />
      <TreeGrid
        rows={rows as NodeRow[]}
        onChangeCell={onChangeCell}
        materials={materials}   // ✅ 넘겨주기
      />

      <div style={{ marginTop: 16, color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>
          * 엑셀 헤더 예: <b>라인번호/line_no</b>, <b>부모라인/parent_line_no</b>, <b>품번/part_no</b>, <b>리비전/revision</b>, <b>이름/name</b>, <b>재질/material_code</b>, <b>무게/weight</b>
        </p>
        <p style={{ margin: 0 }}>
          * <b>대체(replace)</b>: 기존 노드 삭제 후 교체. <b>추가(append)</b>: 기존 뒤에 이어붙임.
        </p>
      </div>
    </div>
  );
}
