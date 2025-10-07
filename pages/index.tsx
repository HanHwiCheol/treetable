// pages/index.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import AuthForm from "../components/AuthForm";
import TableSelector from "../components/TableSelector";
import {
  btnGhost,
  card,
  centerWrap,
  emptyBox
} from "../styles";

type TT = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TT[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!session) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("treetables")
        .select("id,name,created_at,updated_at")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as TT[]);
        setSelectedId(data?.[0]?.id ?? null);
      }
      setLoading(false);
    };
    load();
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const t0 = performance.now();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      const session = data?.session;
      const uid = session?.user?.id ?? null;
      const userEmail = session?.user?.email ?? email ?? null;

      // 로그인 성공 / 실패 로그 기록
      await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: userEmail,
        treetable_id: null,
        step: "Login",
        action: error ? "login_error" : "login Success",
        duration_ms: Math.round(performance.now() - t0),
        detail: error
          ? { message: error.message }
          : { note: "User logged in successfully" }
      }]);

      if (error) {
        alert(error.message);
        return;
      }
      alert("로그인 성공");
    } catch (e: any) {
      // 예외 처리
      await supabase.from("usage_events").insert([{
        user_id: null,
        user_email: email ?? null,
        treetable_id: null,
        step: "Login",
        action: "login_exception",
        duration_ms: Math.round(performance.now() - t0),
        detail: { message: e?.message ?? String(e) }
      }]);
      alert("로그인 중 오류: " + (e?.message ?? "unknown"));
    }
  };

  const signOut = async () => {
    const t0 = performance.now();
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id ?? null;
      const userEmail = s?.session?.user?.email ?? null;

      // ✅ 로그아웃 전 로그 먼저 기록
      await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: userEmail,
        treetable_id: null,
        step: "Logout",
        action: "logout Success",
        duration_ms: Math.round(performance.now() - t0),
        detail: { note: "User clicked logout" }
      }]);

      // ✅ 로그 남긴 후 실제 로그아웃 수행
      await supabase.auth.signOut();

      alert("로그아웃 완료");
    } catch (e: any) {
      console.error("로그아웃 중 오류:", e);
    }
  };


  const handleCreate = async () => {
    const name = prompt("새 TreeTable 이름을 입력:");
    if (!name) return;

    const t0 = performance.now();
    try {
      // 1️⃣ 기존 로직
      const { data, error } = await supabase.rpc("create_treetable", { p_name: name });

      if (error) {
        // 실패도 로그 남기기
        const { data: s } = await supabase.auth.getSession();
        await supabase.from("usage_events").insert([{
          user_id: s.session?.user?.id ?? null,
          user_email: s.session?.user?.email ?? null,
          treetable_id: null,
          step: "EBOM",
          action: "Table create error",
          duration_ms: Math.round(performance.now() - t0),
          detail: { name, message: error.message }
        }]);
        alert(error.message);
        return;
      }

      // 2️⃣ 성공 로그
      const { data: s } = await supabase.auth.getSession();
      await supabase.from("usage_events").insert([{
        user_id: s.session?.user?.id ?? null,
        user_email: s.session?.user?.email ?? null,
        treetable_id: data.id,                   // 새로 생성된 테이블 id
        step: "EBOM",
        action: "EBOM Table create",
        duration_ms: Math.round(performance.now() - t0),
        detail: { name }
      }]);

      // 3️⃣ 다음 페이지 이동
      router.push(`/treetable/${data.id}`);
    } catch (e: any) {
      // 예외 발생 시 로그 남기기
      const { data: s } = await supabase.auth.getSession();
      await supabase.from("usage_events").insert([{
        user_id: s.session?.user?.id ?? null,
        user_email: s.session?.user?.email ?? null,
        treetable_id: null,
        step: "EBOM",
        action: "EBOM Table create exception",
        duration_ms: Math.round(performance.now() - t0),
        detail: { name, message: e?.message ?? String(e) }
      }]);
      alert("생성 중 오류: " + (e?.message ?? "unknown"));
    }
  };

  const handleOpen = async () => {
    if (!selectedId) return;

    const t0 = performance.now();

    try {
      // 1️⃣ 현재 로그인 세션 확인
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id ?? null;
      const email = s?.session?.user?.email ?? null;

      // 2️⃣ usage_events에 로그 남기기
      await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: email,
        treetable_id: selectedId,
        step: "EBOM",
        action: "EBOM Table Open",
        duration_ms: Math.round(performance.now() - t0),
        detail: { note: "TreeTable opened by user" }
      }]);

      // 3️⃣ 페이지 이동
      router.push(`/treetable/${selectedId}`);
    } catch (e: any) {
      console.error("usage_events insert 실패:", e);
      // insert 실패하더라도 페이지 이동은 수행
      router.push(`/treetable/${selectedId}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const target = items.find((x) => x.id === selectedId);
    const ok = confirm(
      `정말 삭제할까요?\n\n이름: ${target?.name ?? selectedId}\n관련 행(노드)도 함께 삭제됩니다.`
    );
    if (!ok) return;

    const t0 = performance.now();
    try {
      // 1️⃣ 자식(노드) 먼저 삭제 (FK CASCADE가 있으면 생략 가능)
      const { error: nodeErr } = await supabase
        .from("treetable_nodes")
        .delete()
        .eq("treetable_id", selectedId);
      if (nodeErr) throw nodeErr;

      // 2️⃣ 부모(테이블) 삭제
      const { error: tblErr } = await supabase
        .from("treetables")
        .delete()
        .eq("id", selectedId);
      if (tblErr) throw tblErr;

      // 3️⃣ 삭제 성공 로그 기록
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id ?? null;
      const email = s?.session?.user?.email ?? null;

      await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: email,
        treetable_id: selectedId,        // 삭제된 테이블 ID
        step: "EBOM",                     // BOM 단계 내 동작
        action: "EBOM Table Delete",                // 삭제 이벤트
        duration_ms: Math.round(performance.now() - t0),
        detail: { name: target?.name ?? null, note: "TreeTable 삭제 완료" },
      }]);

      // 4️⃣ 클라이언트 상태 갱신
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== selectedId);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });

      alert("삭제되었습니다.");
    } catch (e: any) {
      // 삭제 실패도 로그 남김
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id ?? null;
      const email = s?.session?.user?.email ?? null;

      await supabase.from("usage_events").insert([{
        user_id: uid,
        user_email: email,
        treetable_id: selectedId,
        step: "EBOM",
        action: "EBOM Table delete error",
        duration_ms: Math.round(performance.now() - t0),
        detail: { name: target?.name ?? null, message: e?.message ?? String(e) },
      }]);

      alert("삭제 중 오류: " + (e?.message ?? "unknown"));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  // 미로그인 상태
  if (!session) {
    return (
      <div style={centerWrap}>
        <div style={card}>
          <h2>로그인이 필요합니다.</h2>
          <AuthForm onSignIn={signIn} />
        </div>
      </div>
    );
  }

  // 로딩
  if (loading) {
    return (
      <div style={centerWrap}>
        <div style={card}>
          <p>불러오는 중.</p>
        </div>
      </div>
    );
  }

  // 데이터 없음 → 중앙에 “신규 생성” 버튼
  if (items.length === 0) {
    return (
      <div style={centerWrap}>
        <div style={emptyBox}>
          <p>저장된 BOM 테이블이 없습니다.</p>
          <button onClick={handleCreate} style={btnGhost}>
            신규 생성
          </button>
          <button onClick={signOut} style={btnGhost}>
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 데이터 있음 → 콤보박스 중앙 표시 + 열기/신규/삭제
  return (
    <div style={centerWrap}>
      <div style={card}>
        <TableSelector
          items={items}
          selectedId={selectedId}
          onSelect={handleSelect}
          onOpen={handleOpen}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
        <button onClick={signOut} style={btnGhost}>
          로그아웃
        </button>
      </div>
    </div>
  );
}