"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const DEPARTMENTS = [
  "Coğrafya",
  "Tarih",
  "Türk Dili ve Edebiyatı",
  "İngiliz Dili ve Edebiyatı",
  "Sosyoloji",
  "Psikoloji",
  "Felsefe",
  "Arkeoloji",
  "Matematik",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Bilgisayar Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Makine Mühendisliği",
  "İnşaat Mühendisliği",
  "Endüstri Mühendisliği",
  "Gıda Mühendisliği",
  "Mimarlık",
  "Şehir ve Bölge Planlama",
  "Hukuk",
  "İktisat",
  "İşletme",
  "Kamu Yönetimi",
  "Uluslararası İlişkiler",
  "Siyaset Bilimi",
  "Gazetecilik",
  "Radyo Televizyon ve Sinema",
  "Hemşirelik",
  "Tıp",
  "Diş Hekimliği",
  "Eczacılık",
  "Beslenme ve Diyetetik",
  "Fizyoterapi ve Rehabilitasyon",
  "Sınıf Öğretmenliği",
  "Okul Öncesi Öğretmenliği",
  "Türkçe Öğretmenliği",
  "İngilizce Öğretmenliği",
  "Rehberlik ve Psikolojik Danışmanlık",
];

export default function SahaPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [department, setDepartment] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("");

  const [opinion, setOpinion] = useState<
    "destekliyor" | "desteklemiyor" | "kararsiz"
  >("destekliyor");

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [myOpinions, setMyOpinions] = useState<any[]>([]);
  const [loadingMyOpinions, setLoadingMyOpinions] =
    useState(false);
  const [showMyOpinions, setShowMyOpinions] =
    useState(false);

  const filteredDepartments =
    department.trim().length > 0
      ? DEPARTMENTS.filter((item) =>
          item
            .toLocaleLowerCase("tr-TR")
            .includes(
              department
                .trim()
                .toLocaleLowerCase("tr-TR")
            )
        )
      : [];

  async function loadMyOpinions() {
    setLoadingMyOpinions(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingMyOpinions(false);
      return;
    }

    const { data, error } = await supabase
      .from("field_opinions")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Görüşlerim yüklenemedi:",
        error
      );

      alert(
        "Görüşlerim yüklenemedi: " +
          error.message
      );

      setLoadingMyOpinions(false);
      return;
    }

    setMyOpinions(data || []);
    setLoadingMyOpinions(false);
  }

  useEffect(() => {
    loadMyOpinions();
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);

      alert(
        "Oturumunuz bulunamadı. Lütfen tekrar giriş yapın."
      );

      router.replace("/login");

      return;
    }

    const {
      data: adminUser,
      error: roleError,
    } = await supabase
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      roleError ||
      !adminUser ||
      adminUser.role !== "saha_personeli"
    ) {
      setLoading(false);

      alert(
        "Bu işlem için yeterli yetkiniz yok."
      );

      router.replace("/");

      return;
    }

    const { error } = await supabase
      .from("field_opinions")
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim() || null,
        department:
          department.trim() || null,
        opinion,
        note: note.trim() || null,
        created_by: user.id,
        created_by_email:
          user.email || null,
      });

    setLoading(false);

    if (error) {
      console.error(
        "Görüş kaydedilemedi:",
        error
      );

      alert(
        "Görüş kaydedilemedi: " +
          error.message
      );

      return;
    }

    alert(
      "Görüş başarıyla kaydedildi."
    );

    setName("");
    setSurname("");
    setPhone("");
    setDepartment("");
    setSelectedDepartment("");
    setOpinion("destekliyor");
    setNote("");

    await loadMyOpinions();
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl md:text-4xl font-black">
              SAHA
              <span className="text-blue-500">
                360
              </span>
            </h1>

            <p className="text-slate-400 mt-1">
              Saha Görüş Kayıt Ekranı
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-2xl font-bold transition"
          >
            Çıkış Yap
          </button>

        </header>

        {/* YETKİ BİLGİSİ */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">

          <p className="text-blue-300 font-bold">
            👤 Saha Personeli
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Bu ekran yalnızca görüş kaydetmek için kullanılabilir.
          </p>

        </div>

        {/* GÖRÜŞLERİM */}
        <section className="mb-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">

          <button
            type="button"
            onClick={() => {
              setShowMyOpinions(!showMyOpinions);

              if (!showMyOpinions) {
                loadMyOpinions();
              }
            }}
            className="w-full flex items-center justify-between text-left"
          >

            <div>
              <h2 className="text-xl font-black">
                📋 Görüşlerim
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Daha önce kaydettiğiniz görüşleri görüntüleyin.
              </p>
            </div>

            <span className="text-2xl">
              {showMyOpinions ? "▲" : "▼"}
            </span>

          </button>

          {showMyOpinions && (
            <div className="mt-6 space-y-4">

              {loadingMyOpinions ? (

                <div className="text-center text-slate-400 py-6">
                  Görüşler yükleniyor...
                </div>

              ) : myOpinions.length === 0 ? (

                <div className="text-center text-slate-500 py-6">
                  Henüz görüş kaydetmediniz.
                </div>

              ) : (

                myOpinions.map((item) => (

                  <div
                    key={item.id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3 className="font-black text-lg">
                          {item.name} {item.surname}
                        </h3>

                        {item.phone && (
                          <p className="text-sm text-slate-400 mt-1">
                            📞 {item.phone}
                          </p>
                        )}

                        {item.department && (
                          <p className="text-sm text-slate-400 mt-1">
                            🎓 {item.department}
                          </p>
                        )}

                      </div>

                      <div>

                        {item.opinion ===
                          "destekliyor" && (
                          <span className="text-green-400 font-bold">
                            🟢 Destekliyor
                          </span>
                        )}

                        {item.opinion ===
                          "desteklemiyor" && (
                          <span className="text-red-400 font-bold">
                            🔴 Desteklemiyor
                          </span>
                        )}

                        {item.opinion ===
                          "kararsiz" && (
                          <span className="text-yellow-400 font-bold">
                            🟡 Kararsız
                          </span>
                        )}

                      </div>

                    </div>

                    {item.note && (
                      <div className="mt-4 bg-slate-900 rounded-xl p-3">
                        <p className="text-sm text-slate-300">
                          {item.note}
                        </p>
                      </div>
                    )}

                    {item.created_at && (
                      <p className="text-xs text-slate-500 mt-4">
                        {new Date(
                          item.created_at
                        ).toLocaleString("tr-TR")}
                      </p>
                    )}

                  </div>

                ))

              )}

            </div>
          )}

        </section>

        {/* FORM */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">

          <div className="mb-7">

            <h2 className="text-2xl font-black">
              Görüş Kaydet
            </h2>

            <p className="text-slate-400 mt-1">
              Görüşülen kişinin bilgilerini girin.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* AD SOYAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Ad
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Ad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition"
                  required
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Soyad
                </label>

                <input
                  type="text"
                  value={surname}
                  onChange={(e) =>
                    setSurname(e.target.value)
                  }
                  placeholder="Soyad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition"
                  required
                />

              </div>

            </div>

            {/* TELEFON */}
            <div>

              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Telefon
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Telefon numarası"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition"
              />

            </div>

            {/* BÖLÜM */}
            <div className="relative">

              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Bölüm
              </label>

              <input
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setSelectedDepartment("");
                }}
                placeholder="Bölüm"
                autoComplete="off"
                className={`w-full bg-slate-800 border rounded-2xl px-4 py-4 outline-none transition ${
                  selectedDepartment
                    ? "border-green-500 focus:border-green-500"
                    : "border-slate-700 focus:border-blue-500"
                }`}
              />

              {/* SEÇİLDİ */}
              {selectedDepartment && (
                <p className="mt-2 text-sm font-semibold text-green-400">
                  ✓ Seçildi: {selectedDepartment}
                </p>
              )}

              {/* BÖLÜM KARTLARI */}
              {!selectedDepartment &&
                department.trim().length > 0 &&
                filteredDepartments.length > 0 && (

                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">

                    {filteredDepartments.map(
                      (item) => (

                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setDepartment(item);
                            setSelectedDepartment(item);
                          }}
                          className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition"
                        >

                          <span className="text-slate-200 font-semibold">
                            {item}
                          </span>

                        </button>

                      )
                    )}

                  </div>

                )}

            </div>

            {/* GÖRÜŞ */}
            <div>

              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Görüş
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setOpinion("destekliyor")
                  }
                  className={`rounded-2xl p-4 border font-bold transition ${
                    opinion === "destekliyor"
                      ? "bg-green-500/10 border-green-500 text-green-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >

                  <div className="flex items-center justify-center gap-3">

                    <span className="text-xl">
                      🟢
                    </span>

                    <span>
                      Destekliyor
                    </span>

                  </div>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOpinion("desteklemiyor")
                  }
                  className={`rounded-2xl p-4 border font-bold transition ${
                    opinion === "desteklemiyor"
                      ? "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >

                  <div className="flex items-center justify-center gap-3">

                    <span className="text-xl">
                      🔴
                    </span>

                    <span>
                      Desteklemiyor
                    </span>

                  </div>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOpinion("kararsiz")
                  }
                  className={`rounded-2xl p-4 border font-bold transition ${
                    opinion === "kararsiz"
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >

                  <div className="flex items-center justify-center gap-3">

                    <span className="text-xl">
                      🟡
                    </span>

                    <span>
                      Kararsız
                    </span>

                  </div>

                </button>

              </div>

            </div>

            {/* NOT */}
            <div>

              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Not
              </label>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="İsteğe bağlı not..."
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition resize-none"
              />

            </div>

            {/* KAYDET */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl py-4 font-black text-lg transition active:scale-[0.98]"
            >
              {loading
                ? "KAYDEDİLİYOR..."
                : "GÖRÜŞÜ KAYDET"}
            </button>

          </form>

        </section>

        <p className="text-center text-xs text-slate-700 mt-7">
          Saha360 • Saha Görüş Sistemi
        </p>

      </div>
    </main>
  );
}