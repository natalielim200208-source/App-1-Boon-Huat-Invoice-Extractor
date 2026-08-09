import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// In-memory cache to prevent redundant Gemini API calls for identical document uploads
const extractionCache = new Map<string, any>();

function getCacheKey(base64Data: string, filename: string): string {
  // Simple deterministic key based on filename + base64 length + slice
  return `${filename}_${base64Data.length}_${base64Data.slice(0, 100)}_${base64Data.slice(-100)}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 50MB limit for image/PDF base64 payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Gemini API client lazily / on server start
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Invoice OCR / Vision Extraction endpoint
  app.post('/api/extract-invoice', async (req, res) => {
    try {
      const { base64Data, mimeType, filename = 'invoice' } = req.body;

      if (!base64Data || !mimeType) {
        return res.status(400).json({ error: 'Missing base64Data or mimeType' });
      }

      // Clean up base64 prefix if present
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

      // Check cache to avoid hitting Gemini API quota on re-uploaded or identical files
      const cacheKey = getCacheKey(cleanBase64, filename);
      if (extractionCache.has(cacheKey)) {
        console.log(`[Cache Hit] Returning cached extraction for file '${filename}' without calling Gemini API.`);
        return res.json({ success: true, data: extractionCache.get(cacheKey) });
      }

      const ai = getGenAI();

      const systemPrompt = `You are the AI Invoice Data Extraction Engine for Boon Huat Hardware & Supplies Pte Ltd.
Your primary role is to accurately extract invoice fields from uploaded supplier invoices (images or PDFs).

Follow these strict rules:
1. PRIORITISE ACCURACY OVER SPEED.
2. NEVER GUESS missing, cropped, blurry, or unreadable information.
3. If a field is handwritten, missing, ambiguous, or hard to read, assign its confidence level as "low" and explain why in the "confidences" object (e.g., "Handwritten text is faint", "PO number not found on document").
4. For clear, printed, unambiguous text, assign confidence level as "high".
5. Extract numbers strictly as numbers (e.g. 50.00, 150.00). Do not include currency symbols in numeric fields.
6. Look for PO Number references like "PO#", "PO No.", "Order Ref", "Customer PO", "P.O. Number".
7. Extract all line items individually with description, quantity, unit price, and line total.
8. Extract Subtotal, Tax/GST (e.g. 9% GST in Singapore), and Total Amount.
9. Extract Invoice Date and Payment Due Date (or Payment Terms like "Net 30", "Cash on Delivery", "Due in 30 Days").
10. MANDATORY GST/TAX CONSISTENCY RULE: If no explicit GST / Tax breakdown or line item is printed on the document, set taxGst to 0 and ALWAYS assign confidences.taxGst as { "level": "low", "explanation": "No tax or GST line item/breakdown present on invoice (Assumed $0.00 — please verify if supplier is GST-registered)." }. If an explicit GST / Tax breakdown line IS clearly printed on the document (e.g., '9% GST: $18.00'), extract that exact value and set confidence to "high".
11. MANDATORY SUBTOTAL CONSISTENCY RULE: If no explicit 'Subtotal' or 'Sub-total' line item/label is printed on the document, set confidences.subtotal as { "level": "low", "explanation": "No explicit Subtotal line item/label printed on invoice (Derived from line item sum / Total Amount — please verify)." }. Only set subtotal confidence to "high" if a printed 'Subtotal' or 'Sub-total' label is explicitly visible on the document image/PDF.

Return JSON strictly adhering to this structure:
{
  "supplierName": string,
  "invoiceNumber": string,
  "invoiceDate": string,
  "poNumber": string,
  "paymentDueDate": string,
  "paymentTerms": string,
  "lineItems": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number
    }
  ],
  "subtotal": number,
  "taxGst": number,
  "totalAmount": number,
  "confidences": {
    "supplierName": { "level": "high" | "medium" | "low", "explanation": string },
    "invoiceNumber": { "level": "high" | "medium" | "low", "explanation": string },
    "invoiceDate": { "level": "high" | "medium" | "low", "explanation": string },
    "poNumber": { "level": "high" | "medium" | "low", "explanation": string },
    "paymentDueDate": { "level": "high" | "medium" | "low", "explanation": string },
    "subtotal": { "level": "high" | "medium" | "low", "explanation": string },
    "taxGst": { "level": "high" | "medium" | "low", "explanation": string },
    "totalAmount": { "level": "high" | "medium" | "low", "explanation": string }
  },
  "isHandwritten": boolean,
  "isLowQualityScan": boolean,
  "notes": string
}`;

      // Call Gemini API with automatic retry for 503 / high demand spikes
      let response = null;
      let maxAttempts = 3;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          const errMsg = String(err?.message || err);
          const isTransient =
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('resource_exhausted') ||
            errMsg.includes('429');

          if (isTransient && attempt < maxAttempts) {
            console.warn(`[Gemini API] Attempt ${attempt} failed with high demand / 503. Retrying in ${attempt * 1.5}s...`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          } else {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastErr || new Error('Failed to obtain a response from the AI extraction service.');
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini API.');
      }

      const extractedJson = JSON.parse(responseText);

      // Ensure confidences object exists
      if (!extractedJson.confidences || typeof extractedJson.confidences !== 'object') {
        extractedJson.confidences = {};
      }

      // Deterministic Post-Processing Rule 1: Tax/GST Confidence Consistency
      const currentTaxGst = Number(extractedJson.taxGst) || 0;
      const currentTaxConf = extractedJson.confidences.taxGst;
      const taxExpLower = (currentTaxConf?.explanation || '').toLowerCase();
      const hasExplicitPrintedTax =
        currentTaxConf?.level === 'high' &&
        (taxExpLower.includes('printed tax') ||
          taxExpLower.includes('printed gst') ||
          taxExpLower.includes('explicit tax') ||
          taxExpLower.includes('explicit gst') ||
          taxExpLower.includes('gst reg')) &&
        !taxExpLower.includes('no tax') &&
        !taxExpLower.includes('no gst') &&
        !taxExpLower.includes('assumed');

      if (currentTaxGst === 0 || !hasExplicitPrintedTax) {
        extractedJson.taxGst = currentTaxGst;
        extractedJson.confidences.taxGst = {
          level: 'low',
          explanation:
            'No tax or GST line item/breakdown present on invoice (Assumed $0.00 — please verify if supplier is GST-registered).',
        };
      }

      // Deterministic Post-Processing Rule 2: Subtotal Confidence Consistency
      const currentSubtotalConf = extractedJson.confidences.subtotal;
      const subExpLower = (currentSubtotalConf?.explanation || '').toLowerCase();
      const hasExplicitPrintedSubtotal =
        currentSubtotalConf?.level === 'high' &&
        (subExpLower.includes('printed subtotal') ||
          subExpLower.includes('subtotal label') ||
          subExpLower.includes('explicit subtotal')) &&
        !subExpLower.includes('no subtotal') &&
        !subExpLower.includes('derived') &&
        !subExpLower.includes('calculated') &&
        !subExpLower.includes('not printed');

      if (!hasExplicitPrintedSubtotal) {
        extractedJson.confidences.subtotal = {
          level: 'low',
          explanation:
            'No explicit Subtotal line item/label printed on invoice (Derived from line item sum / Total Amount — please verify).',
        };
      }

      // Add unique IDs to line items if missing
      if (Array.isArray(extractedJson.lineItems)) {
        extractedJson.lineItems = extractedJson.lineItems.map((item: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          description: item.description || 'Unspecified Item',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          lineTotal: Number(item.lineTotal) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        }));
      } else {
        extractedJson.lineItems = [];
      }

      // Store in memory cache for re-uploads/duplicate requests
      extractionCache.set(cacheKey, extractedJson);

      res.json({ success: true, data: extractedJson });
    } catch (error: any) {
      console.error('Invoice Extraction Error:', error);
      let userFriendlyMessage = error.message || 'Failed to extract invoice data using Gemini Vision.';
      if (
        userFriendlyMessage.includes('503') ||
        userFriendlyMessage.includes('UNAVAILABLE') ||
        userFriendlyMessage.includes('high demand')
      ) {
        userFriendlyMessage =
          'The AI extraction service is currently experiencing high demand. Please wait a moment and try uploading again.';
      }
      res.status(500).json({
        success: false,
        error: userFriendlyMessage,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
