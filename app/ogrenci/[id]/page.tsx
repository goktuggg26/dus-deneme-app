"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function StudentExamPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const [studentName, setStudentName] = useState("");
  const [isExamStarted, setIsExamStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // --- MOBİLDE NAVİGASYON AÇIK MI? ---
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const examSnap = await getDoc(doc(db, "exams", id));
        if (examSnap.exists()) {
          const data = examSnap.data();
          setExamData(data);
          setTimeLeft(data.duration * 60);
        } else {
          alert("Sınav bulunamadı!");
          router.push("/");
        }

        const qRef = collection(db, "exams", id, "questions");
        const qSnap = await getDocs(qRef);
        const qList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // DÜZELTME 1: Sıralama yaparken tarih yoksa çökmesini engelledik (Güvenli Sıralama)
        qList.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

        setQuestions(qList);
      } catch (err) {
        console.error("Veri hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  useEffect(() => {
    if (loading || !isExamStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // DÜZELTME 2: Süre bittiyse (forceFinish = true) onayı atla
          finishExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isExamStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  const startExam = () => {
    if (studentName.trim() === "") {
      alert("Lütfen adınızı giriniz.");
      return;
    }
    setIsExamStarted(true);
  };

  // --- DÜZELTME 3: forceFinish parametresi eklendi (Zaman dolunca sormadan bitirir) ---
  const finishExam = async (forceFinish = false) => {
    // Eğer zorla bitirilmiyorsa (yani butona basıldıysa) ve süre varsa Onay İste
    if (!forceFinish && timeLeft > 0 && !confirm("Sınavı bitirmek istediğinize emin misiniz?")) return;

    setLoading(true);

    let tbtCorrect = 0, tbtIncorrect = 0, tbtEmpty = 0;
    let kbtCorrect = 0, kbtIncorrect = 0, kbtEmpty = 0;

    questions.forEach(q => {
      const userAnswer = answers[q.id];
      const category = q.category || "Temel";

      const isCorrect = userAnswer === q.correctOption;
      const isEmpty = userAnswer === undefined;
      const isWrong = !isEmpty && !isCorrect;

      if (category === "Temel") {
        if (isEmpty) tbtEmpty++;
        else if (isCorrect) tbtCorrect++;
        else tbtIncorrect++;
      } else {
        if (isEmpty) kbtEmpty++;
        else if (isCorrect) kbtCorrect++;
        else kbtIncorrect++;
      }
    });

    const tbtNet = Math.max(0, tbtCorrect - (tbtIncorrect / 4));
    const kbtNet = Math.max(0, kbtCorrect - (kbtIncorrect / 4));
    const totalNet = tbtNet + kbtNet;

    const scoreK = (tbtNet * 0.4) + (kbtNet * 0.6);
    const scoreT = (tbtNet * 0.6) + (kbtNet * 0.4);

    try {
      const resultData = {
        examId: id,
        examTitle: examData.title,
        studentName: studentName,
        tbt: { correct: tbtCorrect, incorrect: tbtIncorrect, empty: tbtEmpty, net: tbtNet },
        kbt: { correct: kbtCorrect, incorrect: kbtIncorrect, empty: kbtEmpty, net: kbtNet },
        scoreK: scoreK,
        scoreT: scoreT,
        totalNet: totalNet,
        date: new Date(),
        userAnswers: answers
      };

      const docRef = await addDoc(collection(db, "results"), resultData);
      router.push(`/sonuc/${docRef.id}`);

    } catch (error) {
      console.error("Hata:", error);
      alert("Hata oluştu.");
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold">Yükleniyor...</div>;

  // DÜZELTME 4: Eğer sorular yüklenmediyse veya boşsa çökmemesi için kontrol
  if (isExamStarted && questions.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <h2 className="text-xl font-bold">Bu sınavda henüz soru yok.</h2>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-600 underline">Ana Sayfaya Dön</button>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-3xl">📝</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{examData?.title}</h1>
            <p className="text-gray-500 mt-2">Toplam {questions.length} Soru • {examData?.duration} Dakika</p>
          </div>
          <input
            type="text"
            placeholder="Adınız Soyadınız"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-center text-black"
          />
          <button onClick={startExam} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Sınavı Başlat</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ÜST BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 h-16">
        <div>
          <h1 className="font-bold text-gray-800">{examData?.title}</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {currentQuestion?.category || "Genel"}
          </span>
        </div>

        <button onClick={() => setIsNavOpen(!isNavOpen)} className="md:hidden p-2 text-gray-600 bg-gray-100 rounded-lg">
          {isNavOpen ? "Soruyu Gör" : "Tüm Sorular"}
        </button>

        <div className={`font-mono text-xl font-bold px-4 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* ANA İÇERİK (GRID YAPISI) */}
      <div className="flex-1 overflow-hidden relative flex">

        {/* SOL: SORU ALANI */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all ${isNavOpen ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 min-h-[500px] flex flex-col">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex gap-3">
              <span className="text-blue-600 shrink-0">#{currentIndex + 1}</span>
              <span>{currentQuestion?.text}</span>
            </h2>

            {currentQuestion?.imageUrl && (
              <div className="mb-6 flex justify-center">
                <img src={currentQuestion.imageUrl} alt="Görsel" className="max-h-[300px] rounded-lg border object-contain" />
              </div>
            )}

            <div className="space-y-3 flex-1">
              {currentQuestion?.options.map((opt: string, idx: number) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-100 hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border
                            ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                ← Önceki
              </button>
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Sonraki →
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ: SORU NAVİGASYON PALETİ */}
        <div className={`w-full md:w-80 bg-white border-l border-gray-200 flex flex-col absolute md:relative z-20 h-full transition-transform ${isNavOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700">Soru Listesi</h3>
            <div className="flex gap-2 text-xs mt-2">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Dolu</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Boş</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-blue-600 rounded"></div> Aktif</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsNavOpen(false);
                    }}
                    className={`h-10 rounded-lg text-sm font-bold transition-all border
                                    ${isCurrent ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' :
                        isAnswered ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => finishExam(false)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg"
            >
              SINAVI BİTİR
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}