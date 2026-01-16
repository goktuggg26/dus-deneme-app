"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ExamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Verileri
  const [qText, setQText] = useState("");
  const [category, setCategory] = useState("Temel"); // YENİ: Kategori (Varsayılan Temel)
  const [options, setOptions] = useState(["", "", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "exams", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExamTitle(docSnap.data().title);
        }
        fetchQuestions();
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
    fetchData();
  }, [id]);

  const fetchQuestions = async () => {
    if (!id) return;
    const qRef = collection(db, "exams", id, "questions");
    const snapshot = await getDocs(qRef);
    // Soruları tarihe göre sıralayabiliriz, şimdilik olduğu gibi çekiyoruz
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Listeyi oluşturulma tarihine göre sırala (Eskiden yeniye)
    list.sort((a: any, b: any) => a.createdAt?.seconds - b.createdAt?.seconds);
    setQuestions(list);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (options.some(opt => opt.trim() === "") || qText.trim() === "") {
        alert("Lütfen soru metnini ve tüm şıkları doldurun.");
        setLoading(false);
        return;
      }

      let imageUrl = "";

      if (imageFile) {
        const storageRef = ref(storage, `questions/${id}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const questionData = {
        text: qText,
        category: category, // YENİ: Kategori kaydediliyor
        options: options,
        correctOption: correct,
        imageUrl: imageUrl,
        createdAt: new Date()
      };

      await addDoc(collection(db, "exams", id, "questions"), questionData);

      setQText("");
      setOptions(["", "", "", "", ""]);
      setCorrect(0);
      setImageFile(null);

      fetchQuestions();
      alert("Soru başarıyla eklendi!");

    } catch (error) {
      console.error(error);
      alert("Hata oluştu: " + error);
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Bu soruyu silmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "exams", id, "questions", qId));
    fetchQuestions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-6">

        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <Link href="/" className="text-gray-500 hover:text-blue-600 font-medium">← Geri Dön</Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">{examTitle || "Yükleniyor..."}</h1>
            <Link
              href={`/ogrenci/${id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <span>🚀</span> Öğrenci Ekranını Aç
            </Link>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SOL: Soru Ekleme Formu */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-6">
            <h2 className="font-bold text-lg mb-4 text-blue-900">Yeni Soru Ekle</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">

              {/* YENİ: Kategori Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders Kategorisi</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Temel">Temel Bilimler (TBT)</option>
                  <option value="Klinik">Klinik Bilimler (KBT)</option>
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel (Opsiyonel)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imageFile && <p className="text-xs text-green-600 mt-1">Seçilen: {imageFile.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soru Metni</label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 text-black focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Soruyu buraya yazın..."
                />
              </div>

              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${correct === index ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm text-black outline-none focus:border-blue-500"
                      placeholder={`${String.fromCharCode(65 + index)} şıkkı`}
                    />
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={correct === index}
                      onChange={() => setCorrect(index)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                {loading ? "Yükleniyor..." : "Soruyu Kaydet"}
              </button>
            </form>
          </div>

          {/* SAĞ: Eklenen Sorular Listesi */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-800">Eklenen Sorular ({questions.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[700px] overflow-y-auto pr-2 pb-10">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 relative group h-fit">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold ${q.category === 'Klinik' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {q.category || "Temel"}
                    </span>
                  </div>

                  <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    🗑
                  </button>

                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Soru görseli" className="w-full h-24 object-contain bg-gray-50 rounded-lg mb-2" />
                  )}

                  <p className="text-gray-800 font-medium text-sm line-clamp-3 mb-2">{q.text}</p>

                  <div className="space-y-1">
                    {q.options.map((opt: string, idx: number) => (
                      <div key={idx} className={`text-xs p-1 rounded px-2 flex gap-2 ${idx === q.correctOption ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-500'}`}>
                        <span className="font-bold">{String.fromCharCode(65 + idx)})</span> {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}