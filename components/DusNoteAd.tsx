import Link from 'next/link';

export default function DusNoteAd() {
    return (
        <div className="w-full max-w-4xl mb-12 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-lg">
                {/* Background Pattern Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>

                <div className="relative bg-white rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                    <div className="space-y-4 text-center md:text-left flex-1 z-10">
                        <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100 mb-2">
                            ✨ DUS Hazırlığında Yeni Dönem
                        </div>
                        <h3 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight">
                            DusNote ile Başarıyı Not Al!
                        </h3>
                        <p className="text-gray-600 text-lg">
                            Kişiye özel çalışma planı, akıllı tekrar sistemi ve gelişmiş not tutma araçlarıyla
                            DUS sürecini profesyonelce yönet.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                            <Link
                                href="#"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5"
                            >
                                Ücretsiz İndir
                            </Link>
                            <Link
                                href="#"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-gray-700 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                Nasıl Çalışır?
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex-shrink-0 z-10">
                        <div className="w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl rotate-3 flex items-center justify-center shadow-inner border border-indigo-100">
                            <span className="text-7xl filter drop-shadow-md">📘</span>
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 animate-bounce-slow">
                            <span className="text-yellow-500 text-xl">⭐</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800">4.9/5</span>
                                <span className="text-[10px] text-gray-500">Kullanıcı Oyu</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
