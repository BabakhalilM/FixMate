// apps/api-server/src/services/aiAutoFillService.ts
import * as dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export interface ExtractedRepairData {
  deviceType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  problemDescription?: string;
  estimatedCharges?: number;
  deviceSpecs?: Record<string, any>;
}

export class AIAutoFillService {
  private apiKey: string;
  private isConfigured: boolean = false;
  private genAI: GoogleGenerativeAI | null = null;
  private ocrCache: Map<string, { text: string; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ✅ List of models that work with your API key
  private readonly AVAILABLE_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  constructor() {
    this.apiKey =
      process.env.GOOGLE_AI_API_KEY?.trim() ||
      process.env.FREE?.trim() ||
      process.env.GOOGLE_AI_API_KEY_GEMINI?.trim() ||
      "";

    console.log("🔍 AI Service Configuration:");
    console.log("  - API Key:", this.apiKey ? "✅ Present" : "❌ Missing");

    if (this.apiKey && this.apiKey.length > 20) {
      this.isConfigured = true;
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        console.log("✅ Google Gemini AI configured successfully!");
      } catch (error) {
        console.error("❌ Failed to initialize Gemini:", error);
        this.isConfigured = false;
      }
    } else {
      console.warn("⚠️ API key not configured. Using mock data.");
    }
  }

  // ============ OCR WITH CACHE AND RETRY ============
  private async extractTextWithOCRspace(imageUrl: string): Promise<string> {
    try {
      console.log("📷 Extracting text using OCR.space (FREE)...");

      // Check cache first
      const cacheKey = this.getCacheKey(imageUrl);
      const cached = this.ocrCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log("📦 Using cached OCR result");
        return cached.text;
      }

      if (!imageUrl) {
        console.warn("⚠️ No image URL provided");
        return "";
      }

      let base64Data = "";

      // Handle different image input types
      if (imageUrl.startsWith("data:image")) {
        console.log("📸 Processing base64 image...");
        base64Data = imageUrl.split(",")[1] || "";
        if (!base64Data || base64Data.length < 100) {
          console.warn("⚠️ Invalid base64 image data");
          return "";
        }
      } else if (
        imageUrl.startsWith("file://") ||
        imageUrl.startsWith("content://")
      ) {
        console.warn("⚠️ Local file URI detected. Please upload image first.");
        return "";
      } else {
        // Regular URL - fetch and convert
        console.log(`📥 Fetching image from URL...`);
        let lastError = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`  Attempt ${attempt}/3`);
            const response = await fetch(imageUrl, {
              signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const buffer = await response.arrayBuffer();
            base64Data = Buffer.from(buffer).toString("base64");
            console.log(
              `✅ Image fetched successfully (${buffer.byteLength} bytes)`,
            );
            break;
          } catch (error: any) {
            lastError = error;
            console.log(`  Attempt ${attempt} failed: ${error.message}`);
            if (attempt < 3) {
              await new Promise((resolve) =>
                setTimeout(resolve, 2000 * attempt),
              );
            }
          }
        }
        if (!base64Data) {
          console.error(`❌ All fetch attempts failed: ${lastError?.message}`);
          return "";
        }
      }

      // Try OCR.space with multiple engines
      const result = await this.sendToOCR(base64Data);
      if (result) {
        this.ocrCache.set(cacheKey, { text: result, timestamp: Date.now() });
        console.log(`✅ OCR extracted ${result.length} characters`);
        if (result.length > 0) {
          console.log(`📝 Text preview: ${result.substring(0, 100)}...`);
        }
        return result;
      }

      return "";
    } catch (error: any) {
      console.error("❌ OCR.space error:", error.message);
      return "";
    }
  }

  private getCacheKey(imageUrl: string): string {
    if (imageUrl.startsWith("data:image")) {
      return imageUrl.substring(0, 100);
    }
    return imageUrl;
  }

  private async sendToOCR(base64Data: string): Promise<string> {
    // Try multiple OCR engines
    const engines = ["2", "1"];

    for (const engine of engines) {
      try {
        if (!base64Data || base64Data.length < 100) {
          console.warn("⚠️ Image data too small");
          continue;
        }

        console.log(`📤 Sending to OCR.space (Engine ${engine})...`);

        const params = new URLSearchParams();
        params.append("apikey", "helloworld");
        params.append("base64Image", `data:image/jpeg;base64,${base64Data}`);
        params.append("language", "eng");
        params.append("isOverlayRequired", "false");
        params.append("detectOrientation", "true");
        params.append("scale", "true");
        params.append("OCREngine", engine);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.OCRExitCode === 1) {
          const extractedText = data.ParsedResults?.[0]?.ParsedText || "";
          const cleanText = extractedText
            .replace(/\r\n/g, "\n")
            .replace(/\s+/g, " ")
            .trim();

          if (cleanText.length > 10) {
            console.log(`✅ OCR successful with Engine ${engine}`);
            return cleanText;
          }
        } else {
          const errorMsg = data.ErrorMessage || "";
          if (errorMsg.includes("limit") || errorMsg.includes("exceeded")) {
            console.warn("⚠️ OCR.space daily limit reached.");
            break; // No point trying other engines
          }
          console.log(
            `⚠️ Engine ${engine} failed: ${errorMsg || "Unknown error"}`,
          );
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.error(`❌ OCR.space timeout (Engine ${engine})`);
        } else {
          console.error(
            `❌ OCR.space error (Engine ${engine}):`,
            error.message,
          );
        }
      }
    }

    console.error("❌ All OCR engines failed");
    return "";
  }

  // ============ HELPER: Get Working Model ============
  private async getWorkingModel(): Promise<any> {
    if (!this.genAI) {
      throw new Error("Gemini not configured");
    }

    let lastError = null;

    for (const modelName of this.AVAILABLE_MODELS) {
      try {
        console.log(`  Trying model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        // Test with a simple ping
        await model.generateContent("Test");
        console.log(`✅ Using model: ${modelName}`);
        return model;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || "";
        if (errorMsg.includes("404") || errorMsg.includes("not found")) {
          console.log(`  ⚠️ Model ${modelName} not available, trying next...`);
          continue;
        }
        if (errorMsg.includes("429") || errorMsg.includes("503") || errorMsg.includes("high demand")) {
          console.log(`  ⚠️ Model ${modelName} busy, trying next...`);
          continue;
        }
        console.log(`  ⚠️ Model ${modelName} failed:`, error.message);
      }
    }

    throw lastError || new Error("No working models found");
  }

  // ============ GEMINI VISION ANALYSIS (FALLBACK) ============
  private async analyzeWithGeminiVision(
    imageUrl: string,
  ): Promise<ExtractedRepairData> {
    try {
      if (!this.isConfigured || !this.genAI) {
        console.warn("⚠️ Gemini Vision not configured");
        return {};
      }

      console.log("🖼️ Analyzing image with Gemini Vision...");

      // Convert image to base64
      let base64Data = "";

      if (imageUrl.startsWith("data:image")) {
        base64Data = imageUrl.split(",")[1] || "";
      } else if (
        imageUrl.startsWith("file://") ||
        imageUrl.startsWith("content://")
      ) {
        console.warn("⚠️ Local file URI, cannot use Gemini Vision");
        return {};
      } else {
        try {
          const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(30000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = await response.arrayBuffer();
          base64Data = Buffer.from(buffer).toString("base64");
        } catch (error: any) {
          console.error("❌ Failed to fetch image for Vision:", error.message);
          return {};
        }
      }

      if (!base64Data) {
        console.warn("⚠️ No image data for Vision");
        return {};
      }

      // ✅ Get working model
      const model = await this.getWorkingModel();

      const prompt = `
        You are an expert repair technician. Analyze this image and extract repair information.
        
        Look for:
        1. Device type (ac, refrigerator, washing_machine, motor, tv, laptop, fan, water_pump, mobile, other)
        2. Brand name (Samsung, LG, Whirlpool, etc.)
        3. Model number
        4. Serial number
        5. Problem description (what appears to be wrong)
        6. Estimated repair charges in INR
        7. Any visible specifications (tonnage, voltage, capacity, etc.)
        
        Return ONLY valid JSON matching this schema:
        {
          "deviceType": "ac",
          "brand": "Samsung",
          "model": "AR18HV5LBWQ",
          "serialNumber": "SN123456789",
          "estimatedCharges": 2500,
          "deviceSpecs": {"tonnage": "1.5", "voltage": "220V"}
        }
        
        If you cannot determine a field, leave it empty.
        If this is NOT a repair item, set deviceType: "other"
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
      ]);

      const response = await result.response;
      const responseText = response.text();

      console.log(
        `📝 Gemini Vision response received: ${responseText.substring(0, 100)}...`,
      );

      let cleanJson = responseText;
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      const parsedData = JSON.parse(cleanJson);
      console.log("✅ Gemini Vision analysis complete!");
      return this.validateAndCleanData(parsedData);
    } catch (error: any) {
      console.error("❌ Gemini Vision error:", error.message);
      return {};
    }
  }

  // ============ TEXT ANALYSIS WITH GEMINI ============
  private async analyzeWithGeminiText(
    text: string,
  ): Promise<ExtractedRepairData> {
    try {
      if (!text || text.trim().length < 10) {
        console.log("⚠️ Text too short for analysis");
        return {};
      }

      if (!this.isConfigured || !this.genAI) {
        console.warn("⚠️ Gemini not configured");
        return {};
      }

      console.log("🤖 Analyzing text with Gemini...");

      // ✅ Get working model
      const model = await this.getWorkingModel();

      const prompt = `
        You are an expert repair technician. Analyze this text from a repair item.
        
        Text:
        """
        ${text.substring(0, 2000)}
        """
        
        Return ONLY valid JSON matching this schema:
        {
          "deviceType": "ac",
          "brand": "Samsung",
          "model": "AR18HV5LBWQ",
          "serialNumber": "SN123456789",
          "problemDescription": "Not cooling properly",
          "estimatedCharges": 2500,
          "deviceSpecs": {"tonnage": "1.5"}
        }
        
        deviceType must be one of: ac, refrigerator, washing_machine, motor, tv, laptop, fan, water_pump, mobile, other
        estimatedCharges must be a number in INR
        
        If the text is NOT about a repair or device repair request, set:
        - deviceType: "other"
        - problemDescription: "This text is not a repair request"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      console.log(`📝 Gemini response: ${responseText.substring(0, 100)}...`);

      let cleanJson = responseText;
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      const parsedData = JSON.parse(cleanJson);
      console.log("✅ Gemini text analysis complete!");
      return this.validateAndCleanData(parsedData);
    } catch (error: any) {
      console.error("❌ Gemini text analysis error:", error.message);
      return {};
    }
  }

  // ============ SMART MOCK DATA ============
  private getMockData(text: string): ExtractedRepairData {
    console.log("🧪 Using smart mock data fallback");

    const lowerText = text.toLowerCase();
    let deviceType = "other";
    let brand = "Unknown";
    let problem = "Repair needed";

    // Detect device type
    if (lowerText.includes("ac") || lowerText.includes("air condition")) {
      deviceType = "ac";
      problem = "AC not cooling or making noise";
    } else if (
      lowerText.includes("refrigerator") ||
      lowerText.includes("fridge")
    ) {
      deviceType = "refrigerator";
      problem = "Refrigerator not cooling properly";
    } else if (lowerText.includes("washing") || lowerText.includes("machine")) {
      deviceType = "washing_machine";
      problem = "Washing machine not working properly";
    } else if (lowerText.includes("tv") || lowerText.includes("television")) {
      deviceType = "tv";
      problem = "TV has display issues";
    } else if (lowerText.includes("laptop") || lowerText.includes("computer")) {
      deviceType = "laptop";
      problem = "Laptop not working";
    } else if (lowerText.includes("fan")) {
      deviceType = "fan";
      problem = "Fan not working properly";
    } else if (lowerText.includes("motor") || lowerText.includes("pump")) {
      deviceType = "motor";
      problem = "Motor/Pump not working";
    }

    // Detect brand
    if (lowerText.includes("samsung")) brand = "Samsung";
    else if (lowerText.includes("lg")) brand = "LG";
    else if (lowerText.includes("whirlpool")) brand = "Whirlpool";
    else if (lowerText.includes("voltas")) brand = "Voltas";
    else if (lowerText.includes("daikin")) brand = "Daikin";
    else if (lowerText.includes("sony")) brand = "Sony";
    else if (lowerText.includes("dell")) brand = "Dell";
    else if (lowerText.includes("hp")) brand = "HP";
    else if (lowerText.includes("apple") || lowerText.includes("iphone"))
      brand = "Apple";

    return {
      deviceType,
      brand: brand !== "Unknown" ? brand : undefined,
      model: "Model-123",
      serialNumber: "SN" + Date.now().toString().slice(-8),
      problemDescription: problem,
      estimatedCharges: deviceType !== "other" ? 2000 : undefined,
      deviceSpecs: {},
    };
  }

  // ============ MAIN METHODS ============
  async analyzeRepairImage(imageUrl: string): Promise<ExtractedRepairData> {
    try {
      console.log("🔍 Starting image analysis...");

      // STEP 1: Try OCR first
      console.log("📝 Step 1: Attempting OCR text extraction...");
      const extractedText = await this.extractTextWithOCRspace(imageUrl);

      if (extractedText && extractedText.length > 10) {
        console.log(`✅ OCR extracted ${extractedText.length} characters`);
        console.log(`📝 Text preview: ${extractedText.substring(0, 150)}...`);

        // Check if text contains repair-related keywords
        const repairKeywords = [
          "ac",
          "repair",
          "cooling",
          "motor",
          "washing",
          "refrigerator",
          "tv",
          "laptop",
          "fan",
          "pump",
          "compressor",
          "leak",
          "noise",
          "not working",
          "broken",
          "damage",
          "fix",
          "service",
        ];
        const hasRepairKeywords = repairKeywords.some((keyword) =>
          extractedText.toLowerCase().includes(keyword),
        );

        if (!hasRepairKeywords) {
          console.log(
            "ℹ️ Text doesn't appear repair-related, but will still analyze",
          );
        }

        // STEP 2: Analyze text with Gemini
        if (this.isConfigured) {
          console.log("🤖 Step 2: Sending text to Gemini for analysis...");
          const result = await this.analyzeWithGeminiText(extractedText);
          if (Object.keys(result).length > 0) {
            return result;
          }
        }
      } else {
        console.log("⚠️ OCR failed to extract text");
      }

      // STEP 3: If OCR failed or no text, try Gemini Vision
      if (this.isConfigured) {
        console.log("🖼️ Step 3: Trying Gemini Vision (OCR failed)...");
        const visionResult = await this.analyzeWithGeminiVision(imageUrl);
        if (
          Object.keys(visionResult).length > 0 &&
          visionResult.deviceType !== "other"
        ) {
          return visionResult;
        }
      }

      // STEP 4: Final fallback - mock data
      console.log("⚠️ Step 4: Using smart mock data fallback...");
      return this.getMockData(extractedText || "");
    } catch (error: any) {
      console.error("❌ Error in analyzeRepairImage:", error.message);
      return this.getMockData("");
    }
  }

  async analyzeMultipleImages(
  imageUrls: string[],
  deviceType?: string
): Promise<ExtractedRepairData> {
  try {
    console.log(`📸 Analyzing ${imageUrls.length} images...`);
    const combinedData: ExtractedRepairData = {};

    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`\n🖼️ Processing image ${i + 1}/${imageUrls.length}`);
      const result = await this.analyzeRepairImage(imageUrls[i]);

      // Merge results - prefer non-empty values
      for (const [key, value] of Object.entries(result)) {
        if (value && !combinedData[key as keyof ExtractedRepairData]) {
          (combinedData as any)[key] = value;
        }
      }

      // Stop if we have good data (not "other")
      const hasGoodData =
        combinedData.deviceType &&
        combinedData.deviceType !== "other" &&
        combinedData.problemDescription &&
        combinedData.problemDescription !== "This text is not a repair request";
      
      if (hasGoodData) {
        console.log("✅ Found valid repair data, stopping early");
        break;
      }
    }

    // ✅ ONLY try to extract more if:
    // 1. No data at all, OR
    // 2. AI didn't run (not configured), OR
    // 3. We have "other" but also have meaningful text we can parse
    const hasNoData = Object.keys(combinedData).length === 0;
    const isOther = combinedData.deviceType === "other";
    const hasAiResult = combinedData.problemDescription === "This text is not a repair request";
    
    // ✅ Don't run fallback if AI already gave us a meaningful "other" response
    if ((hasNoData || (isOther && !hasAiResult)) && imageUrls.length > 0) {
      console.log("🔄 Trying to extract more data from image text...");
      const text = await this.extractTextWithOCRspace(imageUrls[0]);
      if (text && text.length > 10) {
        const additionalData = this.getMockData(text);
        for (const [key, value] of Object.entries(additionalData)) {
          if (value && !combinedData[key as keyof ExtractedRepairData]) {
            (combinedData as any)[key] = value;
          }
        }
      }
    } else if (hasAiResult) {
      console.log("✅ AI correctly identified this as non-repair content");
    }

    return combinedData;
  } catch (error: any) {
    console.error("❌ Error analyzing multiple images:", error.message);
    return {};
  }
}

  // ============ HELPER ============
  private validateAndCleanData(data: any): ExtractedRepairData {
    const cleaned: ExtractedRepairData = {};

    const validDeviceTypes = [
      "ac",
      "refrigerator",
      "washing_machine",
      "motor",
      "tv",
      "laptop",
      "fan",
      "water_pump",
      "mobile",
      "other",
    ];

    if (data.deviceType) {
      const deviceType = data.deviceType.toLowerCase().trim();
      cleaned.deviceType = validDeviceTypes.includes(deviceType)
        ? deviceType
        : "other";
    }

    if (data.brand && typeof data.brand === "string") {
      cleaned.brand = data.brand.trim();
    }

    if (data.model && typeof data.model === "string") {
      cleaned.model = data.model.trim();
    }

    if (data.serialNumber && typeof data.serialNumber === "string") {
      cleaned.serialNumber = data.serialNumber.trim();
    }

    if (
      data.problemDescription &&
      typeof data.problemDescription === "string"
    ) {
      cleaned.problemDescription = data.problemDescription.trim();
    }

    if (data.estimatedCharges) {
      cleaned.estimatedCharges =
        typeof data.estimatedCharges === "number"
          ? data.estimatedCharges
          : parseInt(data.estimatedCharges) || 0;
    }

    if (data.deviceSpecs && typeof data.deviceSpecs === "object") {
      cleaned.deviceSpecs = data.deviceSpecs;
    }

    return cleaned;
  }

  clearCache(): void {
    this.ocrCache.clear();
    console.log("🧹 OCR cache cleared");
  }
}

export default AIAutoFillService;