export type NodeRow = {
  // 로컬 표시/편집용
  _tmpId?: string;   // 신규/클라이언트 식별
  _level?: number;   // 들여쓰기 레벨(표시용)
  // DB 컬럼
  id?: string | null;
  treetable_id: string;
  parent_id?: string | null;
  line_no?: string | null;
  part_no?: string | null;
  revision?: string | null;
  name?: string | null;
  material_code?: string | null;
  weight?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Material = {
  code: string;      // 예: "AL6061"
  label: string;     // 예: "알루미늄 6061"
  category: string;
  weight: number | null;  // ✅ 추가 (재질별 기준 무게)
};
