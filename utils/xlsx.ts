import * as XLSX from "xlsx";
import { NodeRow } from "@/types/treetable";
import { genTmpId } from "./tree";

/** 엑셀 → NodeRow[] (parent_line_no를 이용해 임시 트리 구성) */
export function rowsFromXlsx(wb: XLSX.WorkBook, treetableId: string): NodeRow[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: null, raw: true });

  const keyMap = (k: string) => {
    const s = String(k).trim().toLowerCase();
    if (/(^|_)line(\s*)no|라인번호/.test(s)) return "line_no";
    if (/(^|_)parent(\s*)line(\s*)no|부모라인|parent/.test(s)) return "parent_line_no";
    if (/part(\s*)no|품번/.test(s)) return "part_no";
    if (/rev|revision|리비전/.test(s)) return "revision";
    if (/name|이름/.test(s)) return "name";
    if (/material|재질|소재|자재코드/.test(s)) return "material_code";
    if (/(unit)?\s*weight|중량|무게|g\/ea|kg\/ea|그램|킬로그램/.test(s)) return "weight";
    return null;
  };

  const rowsRaw = json.map((r: any) => {
    const out: any = {};
    for (const k of Object.keys(r)) {
      const mapped = keyMap(k);
      if (mapped) out[mapped] = r[k];
    }
    return out;
  });

  const byLine = new Map<string, string>(); // line_no -> tmpId
  const tmpRows: (NodeRow & { parent_line_no?: string | null })[] = rowsRaw.map((r: any) => {
    const tmpId = genTmpId();
    if (r.line_no != null) byLine.set(String(r.line_no), tmpId);
    // ✅ 숫자 변환: 문자열/엑셀 숫자 모두 수용
    const parsedWeight =
      r.weight == null || r.weight === ""
        ? null
        : Number(String(r.weight).replace(/[, ]/g, ""));

    return {
      _tmpId: tmpId,
      treetable_id: treetableId,
      parent_id: null,
      line_no: r.line_no ? String(r.line_no) : null,
      part_no: r.part_no ? String(r.part_no) : null,
      revision: r.revision ? String(r.revision) : null,
      name: r.name ? String(r.name) : null,
      weight: Number.isFinite(parsedWeight as number) ? (parsedWeight as number) : null, // ✅ 추가
      material_code: r.material_code ? String(r.material_code) : null,
      parent_line_no: r.parent_line_no != null ? String(r.parent_line_no) : null,
    };
  });

  // parent_id (tmpId 기준) 채우기
  tmpRows.forEach((r) => {
    if (r.parent_line_no) {
      const pid = byLine.get(r.parent_line_no);
      if (pid) r.parent_id = pid;
    }
  });

  // level 계산
  const levelMemo = new Map<string, number>();
  const getLevel = (row: NodeRow & { parent_line_no?: string | null }): number => {
    if (!row._tmpId) return 0;
    if (levelMemo.has(row._tmpId)) return levelMemo.get(row._tmpId)!;
    let lv = 0;
    let cur: any = row;
    const visited = new Set<string>();
    while (cur && cur.parent_id && typeof cur.parent_id === "string") {
      if (visited.has(cur._tmpId!)) break;
      visited.add(cur._tmpId!);
      const parent = tmpRows.find((x) => x._tmpId === cur.parent_id);
      if (!parent) break;
      lv++;
      cur = parent;
    }
    levelMemo.set(row._tmpId!, lv);
    return lv;
  };

  const withLevels = tmpRows.map((r) => ({ ...r, _level: getLevel(r) }));
  withLevels.sort((a, b) => {
    const la = a._level ?? 0;
    const lb = b._level ?? 0;
    if (la !== lb) return la - lb;
    return String(a.line_no ?? "").localeCompare(String(b.line_no ?? ""));
  });

  return withLevels;
}
