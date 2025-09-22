import { CSSProperties } from "react";

export function Toolbar({
  onBack,
  onSave,
  saving,
  importMode,
  setImportMode,
  onFile,
}: {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  importMode: "replace" | "append";
  setImportMode: (m: "replace" | "append") => void;
  onFile: (f: File) => void;
}) {
  return (
    <div style={bar}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontWeight: 600 }}>Excel Import</label>
        <select
          value={importMode}
          onChange={(e) => setImportMode(e.target.value as any)}
          style={selectBox}
          title="replace: 기존 행 삭제 후 대체 / append: 뒤에 추가"
        >
          <option value="replace">대체(replace)</option>
          <option value="append">추가(append)</option>
        </select>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          style={{ border: "1px solid #e5e7eb", padding: 8, borderRadius: 8 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onBack} style={btnGhost}>목록으로</button>
        <button onClick={onSave} disabled={saving} style={btnPrimary}>
          {saving ? "저장 중..." : "저장하기"}
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
};
const selectBox: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 8px",
  background: "white",
};
const btnPrimary: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  background: "#111827",
  color: "white",
};
const btnGhost: CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: "#111827",
  border: "1px solid #e5e7eb",
};
