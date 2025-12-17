// pages/lca/[tableId].tsx

import { useRouter } from "next/router";
import LCAReport from "@/components/LCAReport";

export default function LCAPage() {
  const router = useRouter();
  const { tableId } = router.query;

  // tableId 준비될 때까지 로딩 화면
  if (!tableId || typeof tableId !== "string") {
    return (
      <div style={{ padding: 20, fontSize: 18 }}>
        LCA 보고서를 불러오는 중입니다...
      </div>
    );
  }

  return <LCAReport tableId={tableId} />;
}
