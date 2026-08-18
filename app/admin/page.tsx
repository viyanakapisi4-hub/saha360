"use client";

import { useState } from "react";
import { departments } from "../../lib/departments";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");

  const selectedDepartments =
    faculty && faculty in departments
      ? departments[faculty as keyof typeof departments]
      : [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "demo1234") {
      setLoggedIn(true);
    } else {
      alert("Şifre yanlış.");
    }
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-center p-5">

        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
              <span className="text-2xl font-black">S</span>
            </div>

            <h1 className="text-4xl font-black">
              SAHA<span className="text-blue-500">360</span>
            </h1>

            <p className="text-slate-400 mt-2">
              Yönetim Paneli
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-5">
              Admin Girişi
            </h2>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 rounded-2xl py-4 font-bold transition"
            >
              GİRİŞ YAP
            </button>

            <p className="text-xs text-slate-600 text-center mt-4">
              Demo şifre: demo1234
            </p>
          </form>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-black">
              SAHA<span className="text-blue-500">360</span>
            </h1>

            <p className="text-slate-400 mt-1">
              Demo Yönetim Paneli
            </p>
          </div>

          <button
            onClick={() => setLoggedIn(false)}
            className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-semibold transition"
          >
            Çıkış Yap
          </button>

        </div>

        {/* DEMO İSTATİSTİKLER */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Toplam Demo Kayıt
            </p>

            <p className="text-4xl font-black mt-2">
              24
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Bugünkü Demo Kayıt
            </p>

            <p className="text-4xl font-black mt-2">
              7
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Sistem Durumu
            </p>

            <p className="text-xl font-bold text-green-400 mt-3">
              ● Aktif
            </p>
          </div>

        </div>

        {/* BÖLÜM REHBERİ */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Bölüm Rehberi
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <select
              value={faculty}
              onChange={(e) => {
                setFaculty(e.target.value);
                setDepartment("");
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">
                Fakülte / Birim seç
              </option>

              {Object.keys(departments).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={!faculty}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">
                {faculty ? "Bölüm seç" : "Önce fakülte seç"}
              </option>

              {selectedDepartments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

          </div>

          {faculty && department && (
            <div className="mt-6 p-4 bg-slate-800 rounded-xl">

              <p className="text-slate-400">
                Seçilen fakülte
              </p>

              <p className="font-semibold">
                {faculty}
              </p>

              <p className="text-slate-400 mt-3">
                Seçilen bölüm
              </p>

              <p className="font-semibold">
                {department}
              </p>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}