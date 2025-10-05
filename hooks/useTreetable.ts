import { useEffect, useMemo, useState } from "react";
import { Material, NodeRow } from "@/types/treetable";
import { fetchMaterials, fetchNodes, saveAllNodes, deleteMissingNodes } from "@/services/treetableService";

export function useTreetable(treetableId?: string, p0?: { ready: boolean; }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [rows, setRows] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");

  useEffect(() => {
    if (!treetableId) return;
    (async () => {
      setLoading(true);
      try {
        const [mats, nodes] = await Promise.all([
          fetchMaterials(),
          fetchNodes(treetableId),
        ]);
        setMaterials(mats);
        const withLevel = nodes.map((n) => ({
          ...n,
          _tmpId: n.id ?? "tmp_" + Math.random().toString(36).slice(2, 10),
          _level: (n.line_no?.split(".").length ?? 1) - 1,
        }));
        setRows(withLevel);
      } finally {
        setLoading(false);
      }
    })();
  }, [treetableId]);

  const materialOptions = useMemo(
    () => materials.map((m) => ({ value: m.code, label: `${m.label} (${m.code})` })),
    [materials]
  );

  const onChangeCell = (idx: number, key: keyof NodeRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      const r = { ...next[idx] };

      if (key === "material_code") {
        // 재질 코드만 변경 — 중량은 손대지 않음(엑셀 값 유지)
        r.material_code = value === "" ? null : value;

        // 만약 "엑셀에 weight가 없어서 현재 weight가 빈 값(null)"이라면,
        // 선택한 재질의 기본무게로 채우고 싶을 때만 아래 두 줄을 해제하세요.
        // const m = materials.find(mm => mm.code === value);
        // if (r.weight == null) r.weight = m?.weight ?? null;
        r.updated_at = new Date().toISOString();
      } else if (key === "revision") {
        // 리비전이 바뀌면 재질/무게 초기화 + 수정일 갱신
        r.revision = value === "" ? null : value;
        r.material_code = null;    // ← "선택" 상태
        r.weight = null;           // 재질 초기화에 맞춰 무게도 비움
        r.updated_at = new Date().toISOString();
      } else if (key === "weight") {
        const n = value === "" ? null : Number(value);
        r.weight = Number.isFinite(n as number) ? (n as number) : null;
      } else {
        (r as any)[key] = value === "" ? null : value;
      }

      next[idx] = r;
      return next;
    });
  };

  const save = async () => {
    if (!treetableId) return;
    setSaving(true);
    try {
      // 화면에서 남아있는 기존 id 수집 → 개별 삭제 반영
      const remainIds = rows.filter((r) => r.id).map((r) => r.id!);
      if (importMode !== "replace") {
        await deleteMissingNodes(treetableId, remainIds);
      }
      await saveAllNodes(treetableId, rows, importMode);
      // 저장 후 재조회
      const fresh = await fetchNodes(treetableId);
      setRows(
        fresh.map((n) => ({
          ...n,
          _tmpId: n.id ?? "tmp_" + Math.random().toString(36).slice(2, 10),
          _level: (n.line_no?.split(".").length ?? 1) - 1,
        }))
      );
      alert("저장 완료!");
    } catch (e: any) {
      alert("저장 중 오류: " + (e?.message ?? "unknown"));
    } finally {
      setSaving(false);
    }
  };

  return {
    materials,
    materialOptions,
    rows,
    setRows,
    loading,
    saving,
    importMode,
    setImportMode,
    onChangeCell,
    save,
  };
}
