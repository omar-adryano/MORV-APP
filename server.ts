import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Auto-download missing gradle-wrapper.jar needed for Expo/EAS native build compatibility
const jarDir = path.join(process.cwd(), "android-app", "android", "gradle", "wrapper");
const jarPath = path.join(jarDir, "gradle-wrapper.jar");

if (!fs.existsSync(jarDir)) {
  fs.mkdirSync(jarDir, { recursive: true });
}

if (!fs.existsSync(jarPath)) {
  console.log("📥 [Gradle Wrapper Builder] gradle-wrapper.jar is missing. Fetching original binary...");
  const jarUrl = "https://raw.githubusercontent.com/gradle/gradle/v8.6.0/gradle/wrapper/gradle-wrapper.jar";
  
  const downloadFile = (url: string, destPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle HTTP redirects (GitHub RAW CDN redirects to codeload/media URL)
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Failed to download gradle-wrapper.jar, HTTP status: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        
        file.on("finish", () => {
          file.close();
          console.log("✅ [Gradle Wrapper Builder] gradle-wrapper.jar successfully downloaded and restored!");
          resolve();
        });
      }).on("error", (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  };

  downloadFile(jarUrl, jarPath).catch((err) => {
    console.error("❌ [Gradle Wrapper Builder] Error downloading official gradle-wrapper.jar binary:", err);
  });
}

const app = express();
const PORT = 3000;

// Increase payload bounds for Base64 receipt uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for the Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment. AI capabilities will be simulated.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES FIRST
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * MORV AI Conversational Assistant Proxy
 */
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages body" });
    }

    const client = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    // Default simulated response if API key is missing
    if (!apiKey) {
      const lastUserMsg = messages[messages.length - 1]?.text || "";
      const lowercaseMsg = lastUserMsg.toLowerCase();
      let responseText = "أهلاً بك يا فندم! أنا مساعد MORV الذكي لإدارة أموالك. يبدو أن مفتاح Gemini غير مفعّل في البيئة المؤقتة، لكن يمكنني محاكاة تقديم المشورة المالية لك. كيف يمكنني مساعدتك في تخطيط ميزانيتك اليوم بالجنيه المصري؟";
      
      if (lowercaseMsg.includes("ميزانية") || lowercaseMsg.includes("مصروف")) {
        responseText = "أنصحك بتقسيم ميزانيتك بنسبة 50/30/20: 50% للاحتياجات الأساسية، 30% للمصاريف الشخصية والترفيهية، و20% للادخار أو سداد الديون. في مصر، حاول مراقبة مصاريف السوبرماركت والمواصلات كخطوة أولى لتقليل المصروفات الإجمالية!";
      } else if (lowercaseMsg.includes("تقرير") || lowercaseMsg.includes("تحليل")) {
        responseText = "بناءً على تحليلي التقديري، بلغ معدل إنفاقك هذا الشهر حوالي 65% من الميزانية المخصصة لك، ولديك وفورات مرتقبة تبلغ حوالي 24% بالجنيه المصري. استمر على هذا المنوال لتقليص حجم القروض أو الالتزامات الشهرية!";
      }
      return res.json({ text: responseText });
    }

    // Prepare system instructions for financial advisor MORV AI. 
    // MORV AI speaks natural Arabic with warm Egyptian slang hints but remains strictly professional & commercial.
    const systemInstruction = `
You are "MORV AI" (مساعد مورف الذكي), an elite Arabic AI business & financial management platform counselor built for Egypt and the Arabic market.
You specialize in business intelligence, general expenses tracking, cash flow optimization, daily task list suggestions, savings behavior, and debt resolution.
You use "EGP" (جنيه مصري) as the primary currency context.

Your Tone & Style:
- Speak native, fluent Arabic with a smart, professional, direct Egyptian corporate banking touch (use words like "يا فندم", "تحت أمرك", "ميزانيتك").
- Be concise, accurate, encouraging, and rich in realistic financial strategies.
- Use clear visual lists or short bullet points. Do not write too long paragraphs.
- Provide Egyptian-market helpful tips when asked about saving or investing (e.g., certificates of deposits, smart daily habits, inflation defenses, reducing non-essential expenditures).

Client Financial Context (currently provided for context):
Balance: ${userContext?.balanceEGP || "1,245,000"} EGP
Monthly limit: ${userContext?.monthlyLimit || "45,230"} EGP
Spent: ${userContext?.spentAmount || "12,500"} EGP
Tasks outstanding: ${userContext?.tasksCount || "3"} tasks

Respond directly to the query. If the user greets you, greet them back in friendly but professional business manner.
`;

    // Map message history configuration 
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Generate output with gemini-3.5-flash
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "عذرًا، لم أستطع معالجة هذا الطلب حاليًا." });
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * Intelligent Cash Flow & Expense Prediction Analyzer
 */
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { expenses, budget } = req.body;
    const client = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return simulated financial advisory metrics
      return res.json({
        forecast: "من المتوقع انخفاض معدل الإنفاق بنسبة 4.5% الأسبوع القادم في حال تجنب الوجبات الخارجية.",
        anomalies: ["لوحظ تكرار معاملة 'إيجار السيرفر' مرتين هذا الشهر بشكل غير معتاد."],
        recommendations: [
          "تقليل بند الترفيه بنسبة 10% للتوافق مع مستهدف الادخار لشهر يونيو.",
          "توجيه مبالغ طوارئ تبلغ 2,000 جنيه مصري في بند ادخاري آمن."
        ]
      });
    }

    const payloadPrompt = `
Analyze the following financial list of transactions and state predictions for the next month:
Transactions: ${JSON.stringify(expenses)}
Current Budget details: ${JSON.stringify(budget)}

Provide a structured analysis in Arabic focusing on:
1. Expense Forecasting (توقعات الإنفاق للشهر القادم)
2. Anomaly Detection (كشف أي مصروفات غريبة أو غير معتادة)
3. Actionable saving advice tailored to this list (نصائح مالية مخصصة لزيادة الادخار)

Return the response in JSON structure.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: payloadPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecast: { type: Type.STRING, description: "Forecasting prediction in Arabic" },
            anomalies: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of anomalies spotted or empty if none"
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "At lease 3 specialized Arabic cash flow recommendations"
            }
          },
          required: ["forecast", "anomalies", "recommendations"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Gemini Analyze Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * AI Receipt OCR Reader & Automatic Categorization
 */
app.post("/api/gemini/ocr", async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;
    const client = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "⚠️ لم يتم تكوين مفتاح Gemini API في إعدادات المنصة (Settings > Secrets). يرجى تهيئة GEMINI_API_KEY لتمكين الفحص الذكي الحقيقي للفواتير." 
      });
    }

    if (!imageData) {
      return res.status(400).json({ error: "No image data uploaded" });
    }

    let contentsParts: any[] = [];
    contentsParts.push({
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageData // Base64 segment
      }
    });
    
    contentsParts.push({
      text: "Analyze the provided receipt/invoice. Perform high accuracy OCR extraction. Extract the following properties: 1. Vendor/Store Name (اسم المتجر أو المورد), 2. Total amount as a number in EGP (المبلغ الإجمالي بالجنيه المصري), 3. Plausible category matching one of: 'أعمال', 'مأكولات ومشروبات', 'تكنولوجيا', 'شتى', 'رواتب', 'اشتراكات', 'تسوق' based on the goods sold, 4. Date of transaction in YYYY-MM-DD (تاريخ الشراء), 5. Confidence score from 0.0 to 1.0 depending on the clarity and text readability of the receipt, 6. paymentType (طريقة الدفع مثل نقدي، بطاقة، فيزا، cash, card if available), 7. List of extracted individual items as string array (قائمة بالمنتجات أو العناصر المشتراة)."
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contentsParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor: { type: Type.STRING, description: "Name of store, merchant or supplier" },
            amount: { type: Type.NUMBER, description: "Total amount listed" },
            category: { type: Type.STRING, description: "Best matched Category from: 'أعمال', 'مأكولات ومشروبات', 'تكنولوجيا', 'شتى', 'رواتب', 'اشتراكات', 'تسوق'" },
            date: { type: Type.STRING, description: "Date of transaction or today's date in YYYY-MM-DD" },
            confidence: { type: Type.NUMBER, description: "OCR Confidence score 0 to 1" },
            paymentType: { type: Type.STRING, description: "Payment type if available like Card, Cash, Visa, نقدي, بطاقة" },
            extractedItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Names of distinct products or items list in Arabic if possible"
            }
          },
          required: ["vendor", "amount", "category", "date", "confidence", "extractedItems"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    // Ensure we send back confidence and paymentType
    res.json({
      vendor: result.vendor || "فاتورة غير معروفة",
      amount: result.amount || 0,
      category: result.category || "أعمال",
      date: result.date || new Date().toISOString().split('T')[0],
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.90,
      paymentType: result.paymentType || "",
      extractedItems: Array.isArray(result.extractedItems) ? result.extractedItems : []
    });
  } catch (err: any) {
    console.error("Gemini OCR Error:", err);
    res.status(500).json({ error: err.message || "Failed to process receipt" });
  }
});

/**
 * PDF Export Action
 */
app.get("/api/export/pdf", (req, res) => {
  const fileContent = "MORV SaaS - BUSINESS FINANCIAL REPORT\nGenerated for Egyptian & Arabic Markets\nEGP System ledger reports\n\n© 2026 MORV AI Platform";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=MORV_Financial_Report.pdf");
  res.send(Buffer.from(fileContent));
});

/**
 * Excel Export Action
 */
app.get("/api/export/excel", (req, res) => {
  const csvContent = "Transaction ID,Date,Title,Category,Type,Amount (EGP)\nMRV-101,2026-05-24,مشتريات شركة,أعمال,expense,12500\nMRV-102,2026-05-24,تحويل العميل أ,خدمات,income,45000\nMRV-103,2026-05-23,اشتراك نت,اتصالات,expense,650";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=MORV_Ledger.csv");
  res.send(Buffer.from("\uFEFF" + csvContent, 'utf-8')); // byte order mark for Arabic in Excel
});

// ----------------------------------------------------
// VITE PLATFORM DEVELOPMENT SERVER & MIDDLEWARE Setup
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MORV Commercial Platform Server running on http://localhost:${PORT}`);
  });
}

startServer();
