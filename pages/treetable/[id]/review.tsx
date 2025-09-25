// pages/treetable/[id]/review.tsx
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { saveReview } from "@/services/treetableService";

const CHECK_ITEMS = [
  "주요 부품의 재질/표면처리 스펙이 정의되었는가?",
  "나사/삽입체 표준 부품 규격(규격번호, 재질, 강도 등)이 일치하는가?",
  "체결 토크/접착/용접 등 접합 방식이 각 부품에 명시되었는가?",
  "간섭/충돌(Clearance, Interference) 검토 및 치수공차가 합리적인가?",
  "조립 순서/정렬 지그 없이 조립이 가능한 구조인가?",
  "유지보수/분해 용이성(나사 접근성, 표준 공구 사용)이 확보되었는가?",
  "안전/규정(모서리 R, 핀치포인트, 방열/통풍 등) 요구사항을 만족하는가?",
  "원가/가공성(머시닝 방향, 금형 파팅라인, 최소 R/두께)이 고려되었는가?",
  "강성/진동/피로 수명 측면에서 취약부가 없는가?",
  "BOM과 3D/도면의 부품명·품번·리비전이 일치하는가?",
];

export default function ReviewPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [checked, setChecked] = useState<boolean[]>(
    Array(CHECK_ITEMS.length).fill(false)
  );
  const allChecked = useMemo(() => checked.every(Boolean), [checked]);

  const toggle = (i: number) =>
    setChecked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });

  const handleExportBom = async () => {
    try {
      // TODO: 실제 BOM 추출 로직 실행
      // await exportBom(id!);

      // 추출 끝나면 LCA 리포트 페이지로 이동
      router.push(`/lca/${id}`);
    } catch (e: any) {
      alert("BOM 추출 중 오류: " + (e?.message ?? "unknown"));
    }
  };
  
  const handleSave = async () => {
    try {
      await saveReview(id!, {
        items: CHECK_ITEMS.map((label, i) => ({ label, checked: checked[i] })),
      });
      alert("체크리스트가 저장되었습니다.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert("저장 중 오류 발생:\n" + msg);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* 상단 타이틀 + 버튼 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>설계 검토 체크리스트</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => router.push(`/treetable/${id}`)}>목록으로</button>
          <button className="btn" disabled={!allChecked} onClick={handleExportBom}>BOM 정보 추출</button>
          <button className="btn primary" disabled={!allChecked} onClick={handleSave}>저장하기</button>
        </div>
      </div>

      {/* 카드형 컨테이너 (기존 UI와 유사한 느낌) */}
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display:"grid", rowGap: 10 }}>
          {CHECK_ITEMS.map((label, i) => (
            <label key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              border: "1px solid #eee",
              borderRadius: 8
            }}>
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 간단 스타일 */}
      <style jsx>{`
        .btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #ddd;
          background: #f7f7f7;
          cursor: pointer;
        }
        .btn[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn.primary {
          background: #111;
          color: #fff;
          border-color: #111;
        }
      `}</style>
    </div>
  );
}
