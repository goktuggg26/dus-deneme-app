"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // ŞİFRE KONTROLÜ BURADA (İstersen değiştirebilirsin)
        if (password === "dus123") {
            // Tarayıcıya "Bu kişi patrondur" damgası vuruyoruz
            localStorage.setItem("isAdmin", "true");
            router.push("/"); // Ana sayfaya gönder
        } else {
            alert("Hatalı şifre!");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Yönetici Girişi</h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Şifre Giriniz"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 text-black text-center"
                    />

                    <button className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors">
                        Giriş Yap
                    </button>
                </form>
            </div>
        </div>
    );
}