"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js"; // ✅ 추가

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

  // 1) 세션 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) 리스트 로드
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
        setItems(data as TT[]);
        setSelectedId(data?.[0]?.id ?? null);
      }
      setLoading(false);
    };
    load();
  }, [session]);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: "test@test.com",
      password: "Qwer1234",
    });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreate = async () => {
    const name = prompt("새 TreeTable 이름을 입력:");
    if (!name) return;

    // RPC 방식(권장): app.create_treetable(p_name text)
    const { data, error } = await supabase.rpc("create_treetable", {
      p_name: name,
    });
    
    if (error) {
      // RPC가 없다면 아래 주석 해제하여 직접 insert(방법A)
      // const { data, error } = await supabase
      //   .from("treetables")
      //   .insert({ name })
      //   .select()
      //   .single();
      alert(error.message);
      return;
    }
    router.push(`/treetable/${data.id}`);
  };

  const handleOpen = () => {
    if (!selectedId) return;
    router.push(`/treetable/${selectedId}`);
  };

  // 미로그인 상태
  if (!session) {
    return (
      <div style={centerWrap}>
        <div style={card}>
          <h2>로그인이 필요해</h2>
          <button onClick={signIn} style={btnPrimary}>로그인</button>
        </div>
      </div>
    );
  }

  // 로딩
  if (loading) {
    return (
      <div style={centerWrap}>
        <div style={card}><p>불러오는 중...</p></div>
      </div>
    );
  }

  // 데이터 없음 → 중앙에 “신규 생성” 버튼
  if (items.length === 0) {
    return (
      <div style={centerWrap}>
        <div style={emptyBox}>
          <p>저장된 TreeTable이 없습니다.</p>
          <button onClick={handleCreate} style={btnPrimary}>신규 생성</button>
          <div style={{ marginTop: 16 }}>
            <button onClick={signOut} style={btnGhost}>로그아웃</button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 있음 → 콤보박스 중앙 표시 + 열기/신규
  return (
    <div style={centerWrap}>
      <div style={card}>
        <h2 style={{ marginBottom: 12 }}>BOM Table 선택</h2>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          style={selectBox}
        >
          {items.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name} — {new Date(t.updated_at).toLocaleString()}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleOpen} style={btnPrimary}>열기</button>
          <button onClick={handleCreate} style={btnDefault}>신규 생성</button>
          <button onClick={signOut} style={btnGhost}>로그아웃</button>
        </div>
      </div>
    </div>
  );
}

const centerWrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f7f7f8",
  padding: 16,
};

const card: React.CSSProperties = {
  width: 420,
  background: "white",
  borderRadius: 16,
  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  padding: 20,
  textAlign: "center",
};

const emptyBox: React.CSSProperties = { ...card, width: 460 };

const btnPrimary: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  background: "#111827",
  color: "white",
};

const btnDefault: React.CSSProperties = {
  ...btnPrimary,
  background: "#e5e7eb",
  color: "#111827",
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const selectBox: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
};
