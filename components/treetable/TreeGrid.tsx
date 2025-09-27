import { CSSProperties } from "react";
import { Material, NodeRow } from "@/types/treetable";
import { indentStyle } from "@/utils/tree";

const formatDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "-";

export function TreeGrid({
  rows,
  onChangeCell,
  materials,
}: {
  rows: NodeRow[];
  onChangeCell: (idx: number, key: keyof NodeRow, value: string | number | null) => void;
  materials: Material[];
}) {
  return (
    <div style={wrap}>
      <table style={table}>
        {/* ✅ 고정 컬럼폭 지정 */}
        <colgroup>
          <col style={{ width: 80 }} /> {/* 라인번호 */}
          <col style={{ width: 100 }} /> {/* 품번 */}
          <col style={{ width: 50 }} />  {/* 리비전 */}
          <col style={{ width: 120 }} /> {/* 이름 */}
          <col style={{ width: 120 }} /> {/* 생성일 */}
          <col style={{ width: 120 }} /> {/* 수정일 */}
          <col style={{ width: 200 }} /> {/* 재질 */}
          <col style={{ width: 60 }} /> {/* 무게 */}
        </colgroup>
        <thead style={thead}>
          <tr>
            <th>라인번호</th>
            <th>품번</th>
            <th>리비전</th>
            <th>이름</th>
            <th>생성일</th>
            <th>수정일</th>
            <th>재질</th>
            <th style={{ textAlign: "right", paddingRight: 12 }}>무게</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={emptyCell}>
                데이터가 없습니다. 엑셀을 Import 하세요.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r._tmpId ?? r.id ?? idx} style={rowStyle}>
                {/* 라인번호 */}
                <td>
                  <input
                    value={r.line_no ?? ""}
                    onChange={(e) => onChangeCell(idx, "line_no", e.target.value)}
                    style={{ ...cellInput, ...indentStyle(r._level) }}
                    placeholder="1 · 1.1 · 2 …"
                  />
                </td>
                {/* 품번 */}
                <td>
                  <input
                    value={r.part_no ?? ""}
                    onChange={(e) => onChangeCell(idx, "part_no", e.target.value)}
                    style={cellInput}
                  />
                </td>
                {/* 리비전 */}
                <td>
                  <input
                    value={r.revision ?? ""}
                    onChange={(e) => onChangeCell(idx, "revision", e.target.value)}
                    style={cellInput}
                  />
                </td>
                {/* 이름 */}
                <td>
                  <input
                    value={r.name ?? ""}
                    onChange={(e) => onChangeCell(idx, "name", e.target.value)}
                    style={cellInput}
                  />
                </td>
                {/* 생성일 */}
                <td>
                  <div style={cellInput}>{formatDate(r.created_at)}</div>
                </td>
                {/* 수정일 */}
                <td>
                  <div style={cellInput}>{formatDate(r.updated_at)}</div>
                </td>
                {/* 재질 */}
                <td>
                  <select
                    value={r.material_code ?? ""}
                    onChange={(e) => onChangeCell(idx, "material_code", e.target.value)}
                    style={selectBox}
                  >
                    <option value="">(선택)</option>
                    {materials.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </td>
                {/* 무게 */}
                <td>
                  <input
                    type="number"
                    step="0.000001"
                    value={r.weight ?? ""}
                    onChange={(e) => onChangeCell(idx, "weight", e.target.value)}
                    readOnly
                    style={{ ...cellInput, textAlign: "right", paddingRight: 12 }}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===== 스타일 ===== */
const wrap: CSSProperties = {
  overflowX: "auto",
  marginTop: 12,
  borderRadius: 12,
  boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
};

const table: CSSProperties = {
  width: "100%",
  tableLayout: "fixed",          // ✅ 셀 폭 고정
  borderCollapse: "separate",
  borderSpacing: 0,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  fontSize: 12,
  lineHeight: 1.4,
};

const thead: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "#f9fafb",
  boxShadow: "inset 0 -1px 0 #e5e7eb",
};

const emptyCell: CSSProperties = {
  textAlign: "center",
  padding: 28,
  color: "#6b7280",
};

const rowStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
};

const cellBase: CSSProperties = {
  height: 36,                    // ✅ 행 높이 통일
  display: "flex",
  alignItems: "center",
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: 12,
  background: "white",
};

const cellInput: CSSProperties = {
  ...cellBase,
  outline: "none",
  boxSizing: "border-box",
} as CSSProperties;

const cellReadonly: CSSProperties = {
  ...cellBase,
  background: "#f9fafb",
  color: "#111827",
  whiteSpace: "nowrap",          // ✅ 날짜 줄바꿈 방지
} as CSSProperties;

const selectBox: CSSProperties = {
  ...cellBase,
  appearance: "none",
} as CSSProperties;
