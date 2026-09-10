import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// نموذج الاستجابة المتوقع من النموذج اللغوي — نفس حقول جدول lessons تقريبًا
type GeneratedLesson = {
  objective: string;
  competency: string;
  starting_situation: string;
  warm_up: string;
  teaching_situation_1: string;
  teaching_situation_2: string;
  integration_situation: string;
  evaluation: string;
  cool_down: string;
  organization: string;
  success_criteria: string;
};

const SYSTEM_PROMPT = `أنت مساعد بيداغوجي متخصص في التربية البدنية والرياضية بالطور الابتدائي في الجزائر.
مهمتك: توليد مسودة حصة تربية بدنية بناءً على طلب الأستاذ، مع الالتزام الصارم بما يلي:
- لا تخترع بيانات عن تلاميذ حقيقيين أو نتائجهم — أنت تصمّم بنية الحصة فقط.
- أجب حصرًا بكائن JSON صالح دون أي نص إضافي قبله أو بعده، بالحقول التالية بالضبط:
  objective, competency, starting_situation, warm_up, teaching_situation_1,
  teaching_situation_2, integration_situation, evaluation, cool_down,
  organization, success_criteria
- كل حقل نص عربي واضح وموجز (2-4 جمل)، مناسب لمستوى الطور الابتدائي.
- التزم بالمدة وعدد التلاميذ والمستوى والنشاط المذكورين في طلب الأستاذ إن وُجدوا.`;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "لم يتم إعداد مفتاح API الخاص بالمساعد الذكي على السيرفر (ANTHROPIC_API_KEY)" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const prompt: string | undefined = body?.prompt;

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "الرجاء إدخال وصف الحصة المطلوبة" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // القيمة الافتراضية قابلة للتعديل عبر متغير بيئة حسب أحدث نموذج متاح في حسابك
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `تعذّر الاتصال بالمساعد الذكي: ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText: string = (data.content ?? [])
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n");

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed: GeneratedLesson;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "تعذّر تحليل استجابة النموذج. حاول إعادة الصياغة أو التوليد مرة أخرى." },
        { status: 502 }
      );
    }

    return NextResponse.json({ lesson: parsed });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الاتصال بالمساعد الذكي" }, { status: 502 });
  }
}
