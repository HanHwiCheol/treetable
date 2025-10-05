// pages/treetable/[id]/review.tsx
import { useRouter } from "next/router";
import { useMemo, useState, useEffect } from "react";
 import { saveReview, fetchReview } from "@/services/treetableService";

const CHECK_ITEMS = [
  "주요 부품에 재질(Material)과 표면처리(Surface Treatment)가 정확히 지정되어 있는가?",
  "표준품(나사, 체결구, O-ring, 인서트 등)을 사용하여 설계했는가?",
  "파트 번호, 명칭, 리비전이 3D CAD 모델, EBOM, 2D 도면 간에 일치하는가?",
  "CAD 어셈블리와 Drawing이 최신으로 업데이트되었으며, 표제란에 누락이나 중복이 없는가?",
  "수량(Quantity)은 필요수량에 맞게 입력하였는가?",
  "BOM 항목에 입력된 재질 및 표면처리 정보가 재질 표준 및 규제(예: ROHS/REACH)에 부합하는가?",
  "모든 아이템의 리비전 이력이 업데이트되어 있으며, 진행 중(WIP) 상태가 아닌 확정 상태인가?",
  "도면 및 3D 모델에서 정의된 치수가 입력되었고, 3D 데이터 기준 간섭체크를 수행했는가?",
  "메타데이터(부품번호, 이름, 주요속성)가 정확히 입력되어 있는가?",
  "EBOM이 요구사항(시험 장치, 안전 커버, 환경 조건 등)을 충족하며, 누락된 부품은 없는가?",
];


export default function ReviewPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [checked, setChecked] = useState<boolean[]>(
    Array(CHECK_ITEMS.length).fill(false)
  );

  // ✅ 저장된 체크리스트 초기 로드
  useEffect(() => {
    if (!id) return;
    setChecked(Array(CHECK_ITEMS.length).fill(false));

    (async () => {
      try {
        const saved = await fetchReview(id);
        // saved 형태 예: { items: [{label: string, checked: boolean}, ...] }
        if (saved?.items?.length) {
          const map = CHECK_ITEMS.map(lbl => {
            const hit = saved.items.find((it: any) => it.label === lbl);
            return !!hit?.checked;
          });
          setChecked(map);
        }
      } catch (e: any) {
        console.error("failed to load review:", e?.message ?? e);
      }
    })();
  }, [id]);

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
          <button className="btn" onClick={handleExportBom}>BOM 정보 추출</button>
          <button className="btn primary" onClick={handleSave}>저장하기</button>
        </div>
      </div>

      {/* 카드형 컨테이너 (기존 UI와 유사한 느낌) */}
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "grid", rowGap: 10 }}>
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
