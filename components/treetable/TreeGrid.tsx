import { CSSProperties } from "react";
import { Material, NodeRow } from "@/types/treetable";
import { indentStyle } from "@/utils/tree";

export function TreeGrid({
  rows,
  onChangeCell,
  materials,
}: {
  rows: NodeRow[];
  onChangeCell: (idx: number, key: keyof NodeRow, value: any) => void;
  materials: Material[];
}) {
  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table style={table}>
        <thead>
          <tr>
            <th>라인번호</th>
            <th>품번</th>
            <th>리비전</th>
            <th>이름</th>
            <th>생성일</th>
            <th>수정일</th>
            <th>재질</th>
            <th>무게</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#6b7280" }}>
                데이터가 없습니다. 엑셀을 Import 하세요.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r._tmpId ?? r.id ?? idx}>
                <td>
                  <input
                    value={r.line_no ?? ""}
                    onChange={(e) => onChangeCell(idx, "line_no", e.target.value)}
                    style={{ ...cellInput, ...indentStyle(r._level) }}
                    placeholder="예: 1, 1.1, 2..."
                  />
                </td>
                <td>
                  <input
                    value={r.part_no ?? ""}
                    onChange={(e) => onChangeCell(idx, "part_no", e.target.value)}
                    style={cellInput}
                  />
                </td>
                <td>
                  <input
                    value={r.revision ?? ""}
                    onChange={(e) => onChangeCell(idx, "revision", e.target.value)}
                    style={cellInput}
                  />
                </td>
                <td>
                  <input
                    value={r.name ?? ""}
                    onChange={(e) => onChangeCell(idx, "name", e.target.value)}
                    style={cellInput}
                  />
                </td>
                <td style={{ color: "#6b7280", fontSize: 12 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                </td>
                <td style={{ color: "#6b7280", fontSize: 12 }}>
                  {r.updated_at ? new Date(r.updated_at).toLocaleString() : "-"}
                </td>
                <td>
                  <select
                    value={r.material_code ?? ""}
                    onChange={(e) => onChangeCell(idx, "material_code", e.target.value)}
                    style={selectBox}
                  >
                    <option value="">(선택)</option>
                    {/* ✅ 2) 실제 옵션 렌더링 */}
                    {materials.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label} ({m.code})
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.000001"
                    value={r.weight ?? ""}
                    onChange={(e) => onChangeCell(idx, "weight", e.target.value)}
                    style={cellInput}
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

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
};

const cellInput: CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: 14,
  background: "white",
};

const selectBox: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 8px",
  background: "white",
};
