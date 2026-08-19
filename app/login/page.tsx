"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [adminChecking, setAdminChecking] =
    useState(false);

  const [adminMode, setAdminMode] =
    useState(false);

  useEffect(() => {
    setAdminMode(
      searchParams.get("admin") === "1"
    );
  }, [searchParams]);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setLoading(false);

      alert(
        "Giriş başarısız: " +
          error.message
      );

      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);

      alert(
        "Kullanıcı bilgileri alınamadı."
      );

      return;
    }

    setAdminChecking(true);

    const {
      data: adminUser,
      error: roleError,
    } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    setAdminChecking(false);
    setLoading(false);

    if (roleError) {
      console.error(
        "Rol kontrolü:",
        roleError
      );

      await supabase.auth.signOut();

      alert(
        "Yetki kontrolü sırasında bir hata oluştu."
      );

      return;
    }

    if (adminMode) {
      if (
        !adminUser ||
        adminUser.role !== "admin"
      ) {
        await supabase.auth.signOut();

        alert(
          "Bu işlem için yeterli yetkiniz yok."
        );

        return;
      }

      window.location.href = "/admin";

      return;
    }

    if (
      adminUser?.role ===
      "saha_personeli"
    ) {
      window.location.href = "/saha";

      return;
    }

    if (
      adminUser?.role === "admin"
    ) {
      window.location.href = "/admin";

      return;
    }

    window.location.href = "/";
  }

  async function goToAdmin() {
    setAdminChecking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdminChecking(false);

      window.location.href =
        "/login?admin=1";

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    setAdminChecking(false);

    if (error) {
      console.error(
        "Yetki kontrolü:",
        error
      );

      alert(
        "Yetki kontrolü sırasında bir hata oluştu."
      );

      return;
    }

    if (
      !data ||
      data.role !== "admin"
    ) {
      alert(
        "Bu işlem için yeterli yetkiniz yok."
      );

      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">

        {/* LOGO */}
        <div className="text-center mb-8">

          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center overflow-hidden">

            <img
              src="/saha360-logo.png"
              alt="Saha360 Logo"
              className="w-full h-full object-contain p-2"
            />

          </div>

          <h1 className="text-4xl font-black">

            Saha
            <span className="text-blue-500">
              360
            </span>

          </h1>

          <p className="text-slate-400 mt-2">

            {adminMode
              ? "Yönetici Paneli Girişi"
              : "Yönetici Girişi"}

          </p>

        </div>

        {/* ADMIN MODU */}
        {adminMode && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">

            <p className="text-blue-300 font-bold">
              ⚙️ Yönetici paneline giriş
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Bu alana yalnızca yetkili yöneticiler erişebilir.
            </p>

          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* E-POSTA */}
          <div>

            <label className="block text-sm font-semibold text-slate-300 mb-2">
              E-posta
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="E-posta adresin"
              autoComplete="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition"
              required
            />

          </div>

          {/* ŞİFRE */}
          <div>

            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Şifre
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Şifren"
              autoComplete="current-password"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition"
              required
            />

          </div>

          {/* GİRİŞ BUTONU */}
          <button
            type="submit"
            disabled={
              loading ||
              adminChecking
            }
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl py-4 font-bold transition active:scale-[0.98]"
          >

            {loading ||
            adminChecking
              ? "YETKİ KONTROL EDİLİYOR..."
              : adminMode
                ? "YÖNETİCİ OLARAK GİRİŞ YAP"
                : "GİRİŞ YAP"}

          </button>

        </form>

        {/* ADMIN PANELİ */}
        {!adminMode && (
          <div className="mt-6 pt-6 border-t border-slate-800">

            <button
              type="button"
              onClick={goToAdmin}
              disabled={adminChecking}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded-2xl py-4 font-bold transition"
            >

              {adminChecking
                ? "KONTROL EDİLİYOR..."
                : "⚙️ Yönetici Paneline Git"}

            </button>

          </div>
        )}

        {/* NORMAL GİRİŞE DÖN */}
        {adminMode && (
          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/login";
            }}
            className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition"
          >
            ← Normal girişe dön
          </button>
        )}

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-700 mt-7">
          Saha360 • Saha Görüş Sistemi
        </p>

      </div>

    </main>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-slate-400">
            Yükleniyor...
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}