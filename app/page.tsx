"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const DEPARTMENTS = [
  "Tıp",
  "Diş Hekimliği",
  "Hukuk",
  "İktisat",
  "İşletme",
  "Maliye",
  "Siyaset Bilimi ve Kamu Yönetimi",
  "Uluslararası İlişkiler",
  "Uluslararası Ticaret ve Lojistik",
  "Coğrafya",
  "Tarih",
  "Türk Dili ve Edebiyatı",
  "Sosyoloji",
  "Felsefe",
  "Arkeoloji",
  "Biyoloji",
  "Kimya",
  "Matematik",
  "İngiliz Dili ve Edebiyatı",
  "Mühendislik",
  "Bilgisayar Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği",
  "İnşaat Mühendisliği",
  "Makine Mühendisliği",
  "Tekstil Mühendisliği",
  "Gıda Mühendisliği",
  "Mimarlık",
  "Şehir ve Bölge Planlama",
  "Hemşirelik",
  "Beslenme ve Diyetetik",
  "Fizyoterapi ve Rehabilitasyon",
  "Sağlık Yönetimi",
  "Psikoloji",
  "Rehberlik ve Psikolojik Danışmanlık",
  "Sınıf Öğretmenliği",
  "Türkçe Öğretmenliği",
  "İngilizce Öğretmenliği",
  "Özel Eğitim Öğretmenliği",
  "İlköğretim Matematik Öğretmenliği",
  "Spor Yöneticiliği",
  "Turizm İşletmeciliği",
  "Gastronomi ve Mutfak Sanatları",
];

function normalizeText(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [department, setDepartment] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [showDepartments, setShowDepartments] = useState(false);

  const [opinion, setOpinion] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setLoading(false);
  }

  const filteredDepartments = useMemo(() => {
    const search = normalizeText(
      departmentSearch.trim()
    );

    if (!search) {
      return DEPARTMENTS.slice(0, 8);
    }

    return DEPARTMENTS.filter((item) =>
      normalizeText(item).includes(search)
    ).slice(0, 8);
  }, [departmentSearch]);

  function selectDepartment(value: string) {
    setDepartment(value);
    setDepartmentSearch(value);
    setShowDepartments(false);
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!name.trim() || !surname.trim()) {
      alert("Lütfen ad ve soyad girin.");
      return;
    }

    if (!department) {
      alert("Lütfen bölüm seçin.");
      return;
    }

    if (!opinion) {
      alert("Lütfen kişinin görüşünü seçin.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(
        "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın."
      );

      router.replace("/login");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("field_opinions")
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim() || null,

        department,
        opinion,
        note: note.trim() || null,

        // Kaydı yapan yöneticinin kimliği
        created_by: user.id,

        // Kaydı yapan yöneticinin e-posta adresi
        created_by_email: user.email || null,
      });

    if (error) {
      console.error(
        "Kayıt ekleme hatası:",
        error
      );

      alert(
        "Görüş kaydedilemedi: " +
          error.message
      );

      setSaving(false);
      return;
    }

    // Formu temizle
    setName("");
    setSurname("");
    setPhone("");

    setDepartment("");
    setDepartmentSearch("");
    setShowDepartments(false);

    setOpinion("");
    setNote("");

    setSaving(false);

    alert("Görüş başarıyla kaydedildi.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full mx-auto mb-4" />

          <p className="text-slate-400">
            Yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">

      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <header className="relative mb-10">

          <div className="flex flex-col items-center text-center">

            <div className="w-24 h-24 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-xl shadow-blue-500/10 overflow-hidden mb-4">

              <img
                src="/saha360-logo.png"
                alt="Saha360 Logo"
                className="w-full h-full object-contain p-2"
              />

            </div>

            <h1 className="text-4xl md:text-5xl font-black">
              Saha
              <span className="text-blue-500">
                360
              </span>
            </h1>

            <p className="text-slate-400 mt-2 text-lg">
              Saha Görüşü
            </p>

          </div>

          <div className="absolute right-0 top-0">

            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-2xl font-bold transition active:scale-95"
            >
              Çıkış Yap
            </button>

          </div>

        </header>

        {/* FORM */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">

          <div className="mb-7">

            <h2 className="text-2xl md:text-3xl font-black">
              Yeni Görüş Ekle
            </h2>

            <p className="text-slate-400 mt-2">
              Öğrenciyle yapılan görüşmenin sonucunu sisteme kaydet.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* AD SOYAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

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
                  placeholder="Öğrencinin adı"
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
                  placeholder="Öğrencinin soyadı"
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
                placeholder="05XX XXX XX XX"
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
                value={departmentSearch}
                onChange={(e) => {
                  setDepartmentSearch(
                    e.target.value
                  );
                  setDepartment("");
                  setShowDepartments(true);
                }}
                onFocus={() =>
                  setShowDepartments(true)
                }
                placeholder="Bölümün baş harflerini yaz..."
                className={`w-full bg-slate-800 border ${
                  department
                    ? "border-green-500"
                    : "border-slate-700"
                } rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition`}
                autoComplete="off"
                required
              />

              {department && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-400">

                  <span>✓</span>

                  <span>
                    Seçildi:{" "}
                    <strong>
                      {department}
                    </strong>
                  </span>

                </div>
              )}

              {/* BÖLÜM KARTLARI */}
              {showDepartments &&
                filteredDepartments.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

                    {filteredDepartments.map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() =>
                            selectDepartment(item)
                          }
                          className="w-full text-left px-5 py-4 hover:bg-slate-700 transition flex items-center gap-3 border-b border-slate-700 last:border-0"
                        >

                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            🎓
                          </div>

                          <div>

                            <p className="font-bold text-white">
                              {item}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Bölümü seç
                            </p>

                          </div>

                        </button>
                      )
                    )}

                  </div>
                )}

              {showDepartments &&
                departmentSearch.trim() !== "" &&
                filteredDepartments.length === 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-2xl">

                    <p className="text-slate-400 text-sm">
                      Bu aramayla eşleşen bölüm bulunamadı.
                    </p>

                  </div>
                )}

            </div>

            {/* GÖRÜŞ */}
            <div>

              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Bu sezon destekliyor mu?
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* DESTEKLİYOR */}
                <button
                  type="button"
                  onClick={() =>
                    setOpinion("destekliyor")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    opinion === "destekliyor"
                      ? "bg-green-500/15 border-green-500 text-green-400"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-green-500/50"
                  }`}
                >

                  <div className="text-2xl mb-2">
                    🟢
                  </div>

                  <p className="font-black">
                    Destekliyor
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Destek vereceğini belirtti.
                  </p>

                </button>

                {/* DESTEKLEMİYOR */}
                <button
                  type="button"
                  onClick={() =>
                    setOpinion("desteklemiyor")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    opinion === "desteklemiyor"
                      ? "bg-red-500/15 border-red-500 text-red-400"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-red-500/50"
                  }`}
                >

                  <div className="text-2xl mb-2">
                    🔴
                  </div>

                  <p className="font-black">
                    Desteklemiyor
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Destek vermeyeceğini belirtti.
                  </p>

                </button>

                {/* KARARSIZ */}
                <button
                  type="button"
                  onClick={() =>
                    setOpinion("kararsiz")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    opinion === "kararsiz"
                      ? "bg-yellow-500/15 border-yellow-500 text-yellow-400"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-yellow-500/50"
                  }`}
                >

                  <div className="text-2xl mb-2">
                    🟡
                  </div>

                  <p className="font-black">
                    Kararsız
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Henüz karar vermedi.
                  </p>

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
                placeholder="Görüşmeyle ilgili eklemek istediğin not..."
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500 transition resize-none"
              />

            </div>

            {/* KAYDET */}
            <button
              type="submit"
              disabled={
                saving ||
                !opinion ||
                !department
              }
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl py-4 font-black text-lg transition active:scale-[0.98]"
            >

              {saving
                ? "KAYDEDİLİYOR..."
                : "GÖRÜŞÜ KAYDET"}

            </button>

          </form>

        </section>

        {/* FOOTER */}
        <footer className="text-center mt-10 pb-5">

          <p className="text-sm font-semibold text-slate-500">
            Saha360
          </p>

          <p className="text-xs text-slate-600 mt-1">
            Saha Görüş Sistemi
          </p>

        </footer>

      </div>

    </main>
  );
}