"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: "han6038@gail.com",
      password: "Qwer1234", // 나중에 이메일+비번 계정 생성 후 교체
    });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
        <button onClick={signIn}>로그인</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
      <p>로그인됨: {session.user.email}</p>
      <button onClick={signOut}>로그아웃</button>
    </div>
  );
}
