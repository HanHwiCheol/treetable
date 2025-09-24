import { CSSProperties } from "react";
import { useRouter } from "next/router";
import { NodeRow } from "@/types/treetable";

export function Toolbar({
  onBack,
  onSave,
  saving,
  importMode,
  setImportMode,
  onFile,
  rows,
  treetableId,
}: {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  importMode: "replace" | "append";
  setImportMode: (m: "replace" | "append") => void;
  onFile: (f: File) => void;
  rows: NodeRow[];
  treetableId?: string | null;
}) {
  const router = useRouter();

  // ✅ 재질이 모두 선택되었는지 검사
  const allMaterialsChosen =
    rows.length > 0 && rows.every((r) => !!(r.material_code && r.material_code !== ""));

  return (
    <div style={bar}>
      {/* 왼쪽: Excel Import */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontWeight: 600 }}>Excel Import</label>
        <select
          value={importMode}
          onChange={(e) => setImportMode(e.target.value as "replace" | "append")}
          style={selectBox}
          title="replace: 기존 행 삭제 후 대체 / append: 뒤에 추가"
        >
          <option value="replace">대체(replace)</option>
          <option value="append">추가(append)</option>
        </select>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          style={{ border: "1px solid #e5e7eb", padding: 8, borderRadius: 8 }}
        />
      </div>

      {/* 오른쪽: 목록으로 | 저장하기(흰색) | 다음단계(흰색, 조건부 활성화) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
      <button onClick={onBack} style={btnGhost}>목록으로</button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ ...btnGhost, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
      <button
        onClick={() => router.push(`/treetable/${treetableId}/review`)}
        disabled={!rows.length || !rows.every(r => !!r.material_code)}
        style={{
          ...btnGhost,
          opacity: rows.length && rows.every(r => !!r.material_code) ? 1 : 0.5,
          cursor: rows.length && rows.every(r => !!r.material_code) ? "pointer" : "not-allowed",
        }}
      >
        다음단계
      </button>
    </div>
  </div>
  );
}

const bar: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "nowrap",
};

const selectBox: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 8px",
  background: "white",
};

const btnGhost: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",        // ← 흰색 배경
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};
