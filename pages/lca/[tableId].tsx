// pages/lca/[tableId].tsx
import dynamic from "next/dynamic";

const LCAReport = dynamic(() => import("../../components/LCAReport"), { ssr: false });

export default function LcaPage({ query }: any) {
  // pages 라우터에서 getInitialProps 없이도 아래처럼 처리 가능(단, 클라 사이드에서만 사용)
  const tableId =
    typeof window !== "undefined"
      ? decodeURIComponent(window.location.pathname.split("/").pop() || "")
      : (query?.tableId ?? "");

  return (
    <main>
      <LCAReport tableId={tableId} />
    </main>
  );
}
