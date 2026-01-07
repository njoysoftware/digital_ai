# 🚀 Digital AI

Digital AI  adalah aplikasi web modern berbasis **AI** yang dibangun menggunakan **Next.js**, **Google Generative AI (GenAI)**, dan **shadcn/ui**. Aplikasi ini dirancang dengan UI yang bersih, modern, dan siap dikembangkan untuk berbagai kebutuhan AI seperti chat AI, generasi konten, dan asisten digital.

🌐 **Live Demo**: [https://digital-ai-hazel.vercel.app/](https://digital-ai-hazel.vercel.app/)

---

## 🧱 Tech Stack

* **Next.js** – React framework dengan App Router & performa tinggi
* **Google Generative AI (Gemini)** – Engine AI generatif dari Google
* **shadcn/ui** – Reusable & customizable UI components
* **Tailwind CSS** – Utility-first CSS framework


---

## ✨ Fitur

* ⚡ Modern UI dengan shadcn/ui
* 🤖 Integrasi Google GenAI (Gemini)
* 📱 Responsive & mobile friendly
* 🧩 Struktur scalable untuk pengembangan AI lanjutan
* 🚀 Siap production & deploy

---

## 📦 Instalasi & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/njoysoftware/digital_ai.git
cd digital_ai
```

### 2️⃣ Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 3️⃣ Environment Variable

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY
```

> 🔐 **Catatan:** Jangan commit API key ke repository publik.

### 4️⃣ Jalankan Development Server

```bash
npm run dev
# atau
pnpm dev
```

Akses di browser:

```
http://localhost:3000
```

---

## 🤖 Contoh Integrasi Google GenAI

```ts
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY,
});

export async function generateText(prompt: string) {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return result.text;
}
```

---

## 🎨 shadcn/ui Usage

Install & tambah komponen:

```bash
npx shadcn@latest init
npx shadcn@latest add button card input dialog
```

Contoh penggunaan:

```tsx
import { Button } from "@/components/ui/button";

<Button>Generate AI</Button>
```

---

## 📁 Struktur Project

```
.
├── app/                # App Router Next.js
├── components/         # UI components (shadcn/ui)
├── lib/                # Helper & AI logic
├── public/             # Static assets
├── styles/             # Global styles
├── .env.local          # Environment variables
├── next.config.js
└── tailwind.config.js
```

---

## 🚀 Deployment

menggunakan **Vercel**:

Pastikan environment variable sudah di-set di dashboard Vercel.

---

## 🤝 Kontribusi

Pull request dan issue sangat terbuka.

Langkah umum:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Add new feature'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

---

## 📄 Lisensi

MIT License 

NIZAR SURYAMAN
© 2026 Digital AI

---

> Dibangun dengan ❤️ menggunakan Next.js, Google GenAI, dan shadcn/ui
