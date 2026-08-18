"use client";

import { useState } from "react";
import { departments } from "../lib/departments";

export default function Home() {
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedDepartments =
    faculty && faculty in departments
      ? departments[faculty as keyof typeof departments]
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!faculty || !department) {
      alert("Lütfen fakülte ve bölüm seçin.");
      return;
    }

    setSaved(true);
  };

  const resetForm = () => {
    setSaved(false);
    setFaculty("");
    setDepartment("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-center p-5">

      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8 animate-[fadeIn_0.7s_ease-out]">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4 animate-[float_3s_ease-in-out_infinite]">
            <span className="text-2xl font-black">
              S
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            SAHA<span className="text-blue-500">360</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Üniversite Bölüm Rehberi
          </p>

        </div>

        {/* ANA KART */}
        {saved ? (

          <div
            className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-8 shadow-2xl text-center animate-[scaleIn_0.35s_ease-out]"
          >

            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6 animate-[pop_0.5s_ease-out]">

              <span className="text-4xl text-green-400">
                ✓
              </span>

            </div>

            <h2 className="text-2xl font-black">
              Tamamlandı!
            </h2>

            <p className="text-slate-400 mt-2">
              Bölüm seçimin başarıyla tamamlandı.
            </p>

            <div className="mt-6 bg-slate-800 rounded-2xl p-4 text-left">

              <p className="text-xs text-slate-400">
                Fakülte / Birim
              </p>

              <p className="font-semibold mt-1">
                {faculty}
              </p>

              <p className="text-xs text-slate-400 mt-4">
                Bölüm
              </p>

              <p className="font-semibold mt-1">
                {department}
              </p>

            </div>

            <button
              onClick={resetForm}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] rounded-2xl py-4 font-bold transition-all duration-200"
            >
              Yeni Seçim Yap
            </button>

          </div>

        ) : (

          <div
            className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-2xl animate-[slideUp_0.5s_ease-out]"
          >

            <div className="mb-6">

              <h2 className="text-xl font-bold">
                Bölümünü Seç
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Fakülteni ve bölümünü aşağıdan seçebilirsin.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* FAKÜLTE */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fakülte / Birim
                </label>

                <select
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value);
                    setDepartment("");
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:scale-[1.01]"
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

              </div>

              {/* BÖLÜM */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bölüm
                </label>

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!faculty}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:scale-[1.01] disabled:opacity-40"
                >

                  <option value="">
                    {faculty
                      ? "Bölüm seç"
                      : "Önce fakülte / birim seç"}
                  </option>

                  {selectedDepartments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}

                </select>

              </div>

              {/* BUTON */}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.97] rounded-2xl py-4 mt-2 font-bold text-lg transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
              >
                DEVAM ET
              </button>

            </form>

          </div>

        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          SAHA360 • Bölüm Rehberi
        </p>

      </div>

      {/* ANİMASYONLAR */}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pop {
          0% {
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

    </main>
  );
}