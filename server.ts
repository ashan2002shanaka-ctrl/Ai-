import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Tightened body parsing limit: 25mb for images and documents (prevents memory starvation / DoS)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-Memory Sliding Window Rate Limiter
interface RateLimitBucket {
  timestamps: number[];
}
const rateLimitStore = new Map<string, RateLimitBucket>();

// Periodic cleanup of stale rate-limit buckets every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60000);
    if (bucket.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 180000);

function rateLimit(maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let bucket = rateLimitStore.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      rateLimitStore.set(key, bucket);
    }

    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60000);

    if (bucket.timestamps.length >= maxPerMinute) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({
        error: `Rate limit exceeded. Maximum ${maxPerMinute} requests per minute allowed. Please wait before retrying.`,
      });
      return;
    }

    bucket.timestamps.push(now);
    next();
  };
}

// Initialize Google GenAI client securely on the server
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Allowlist of verified models
const ALLOWED_CHAT_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-4-argon',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'text/x-python',
  'text/typescript',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/mpeg',
]);

const ALLOWED_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Default)',
    description: 'Flagship speed, deep reasoning, coding, and multimodal intelligence',
    capabilities: ['chat', 'vision', 'documents', 'search_grounding', 'multilingual'],
    recommended: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-low latency, cost-effective model for high-speed queries',
    capabilities: ['chat', 'fast_response'],
    recommended: false,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    description: 'Advanced STEM reasoning, architecture, and mathematics (Requires Paid Key)',
    capabilities: ['chat', 'advanced_stem', 'deep_reasoning'],
    requiresPaid: true,
    recommended: false,
  },
];

// Configuration & Health Endpoint (Never returns secret values)
app.get('/api/config', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    appName: 'BLACK GHOST AI',
    tagline: 'Beyond Limits. Beyond Imagination.',
    hasApiKey,
    defaultModel: 'gemini-3.8-flash',
    models: AVAILABLE_MODELS,
    speechSupported: true,
    imageGenerationSupported: true,
    searchGroundingSupported: true,
  });
});

// Chat Streaming Endpoint with Rate Limiting (35 req/min per IP)
app.post('/api/chat', rateLimit(35), async (req: Request, res: Response): Promise<void> => {
  const ai = getGenAI();
  if (!ai) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in server environment. Please configure your key in Settings > Secrets.',
    });
    return;
  }

  const {
    messages,
    model = 'gemini-3.8-flash',
    systemInstruction,
    temperature = 0.7,
    enableSearch = false,
  } = req.body;

  // 1. Validate messages array structure & size limits
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing or invalid messages array' });
    return;
  }

  if (messages.length > 80) {
    res.status(400).json({ error: 'Conversation history exceeds maximum limit of 80 messages.' });
    return;
  }

  // 2. Validate model identifier against allowlist
  const selectedModel = typeof model === 'string' && ALLOWED_CHAT_MODELS.has(model)
    ? model
    : 'gemini-3.8-flash';

  // 3. Format and strictly validate each message & attachment
  const contents: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== 'object') {
      res.status(400).json({ error: `Invalid message structure at index ${i}` });
      return;
    }

    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    const parts: any[] = [];

    // Multimodal attachments validation
    if (m.attachments && Array.isArray(m.attachments)) {
      if (m.attachments.length > 6) {
        res.status(400).json({ error: 'Maximum 6 attachments allowed per message.' });
        return;
      }

      for (const att of m.attachments) {
        if (!att || typeof att !== 'object') continue;

        const rawMime = att.mimeType || att.type;
        const mime = typeof rawMime === 'string' ? rawMime.toLowerCase() : '';
        const isAllowedMime =
          ALLOWED_MIME_TYPES.has(mime) ||
          mime.startsWith('image/') ||
          mime.startsWith('text/');

        if (!isAllowedMime) {
          res.status(400).json({
            error: `File type "${mime}" is not supported for security reasons. Please use standard images, PDFs, CSV, or text documents.`,
          });
          return;
        }

        if (att.data && typeof att.data === 'string') {
          // Limit individual attachment base64 payload to ~14MB
          if (att.data.length > 15 * 1024 * 1024) {
            res.status(400).json({ error: 'Attachment data exceeds safe size limit (10MB).' });
            return;
          }

          const cleanBase64 = att.data.includes(',')
            ? att.data.split(',')[1]
            : att.data;

          parts.push({
            inlineData: {
              mimeType: mime,
              data: cleanBase64,
            },
          });
        }
      }
    }

    // Text content validation (accepts m.text or m.content)
    const rawText = typeof m.text === 'string' ? m.text : (typeof m.content === 'string' ? m.content : '');
    if (rawText) {
      if (rawText.length > 40000) {
        res.status(400).json({ error: 'Individual message content exceeds 40,000 characters limit.' });
        return;
      }
      if (rawText.trim().length > 0) {
        parts.push({ text: rawText });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    contents.push({ role, parts });
  }

  // Setup Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const config: any = {
    temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
  };

  const defaultSystemPrompt =
    'You are BLACK GHOST AI, an elite, highly intelligent, futuristic personal AI assistant created with supreme capabilities in reasoning, coding, writing, STEM, creative problem solving, and document intelligence. You provide authoritative, precise, insightful, and friendly responses. When answering technical or code questions, format cleanly with markdown syntax highlighting. If unsure or information is unavailable, clearly state your uncertainty instead of fabricating answers.';

  const sanitizedCustom = typeof systemInstruction === 'string'
    ? systemInstruction.slice(0, 8000).trim()
    : '';

  config.systemInstruction = sanitizedCustom
    ? `${defaultSystemPrompt}\n\nUser custom instructions: ${sanitizedCustom}`
    : defaultSystemPrompt;

  if (Boolean(enableSearch)) {
    config.tools = [{ googleSearch: {} }];
  }

  let currentModel = selectedModel;
  let stream: any = null;

  try {
    try {
      if (currentModel === 'gemini-3.8-flash') {
        const connectPromise = ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initial connection timeout - high demand')), 7000)
        );
        stream = (await Promise.race([connectPromise, timeoutPromise])) as any;
      } else {
        stream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });
      }
    } catch (primaryErr: any) {
      const errStr = String(primaryErr?.message || primaryErr || '');
      if (
        (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE') || errStr.includes('timeout')) &&
        currentModel === 'gemini-3.8-flash'
      ) {
        console.warn('Gemini 3.8 Flash high demand or timeout, falling back to Gemini 3.1 Flash Lite...');
        currentModel = 'gemini-3.1-flash-lite';
        stream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });
      } else {
        throw primaryErr;
      }
    }

    let fullAnswer = '';

    try {
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullAnswer += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }

        const groundingChunks =
          chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
          const sources = groundingChunks
            .filter((gc: any) => gc?.web?.uri)
            .map((gc: any) => ({
              title: gc.web?.title || 'Web Source',
              url: gc.web?.uri,
            }));
          if (sources.length > 0) {
            res.write(`data: ${JSON.stringify({ sources })}\n\n`);
          }
        }
      }
    } catch (streamIterErr: any) {
      const errStr = String(streamIterErr?.message || streamIterErr || '');
      if (
        fullAnswer.length === 0 &&
        currentModel === 'gemini-3.8-flash' &&
        (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE') || errStr.includes('timeout'))
      ) {
        console.warn('First chunk threw 503 or timed out, streaming fallback to Gemini 3.1 Flash Lite...');
        currentModel = 'gemini-3.1-flash-lite';
        const fallbackStream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });
        for await (const chunk of fallbackStream) {
          const text = chunk.text;
          if (text) {
            fullAnswer += text;
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }
      } else {
        throw streamIterErr;
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullLength: fullAnswer.length, modelUsed: currentModel })}\n\n`);
    res.end();
  } catch (error: any) {
    let readableError = 'Failed to generate response from Gemini API.';

    try {
      const rawMsg = error?.message || '';
      if (rawMsg.includes('503') || rawMsg.includes('high demand')) {
        readableError = 'The model is currently experiencing temporary high demand. Please try again in a few moments, or switch to Gemini 3.1 Flash Lite.';
      } else if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        if (currentModel === 'gemini-4-argon') {
          readableError = 'Gemini 4 Argon requires a tier with Gemini 4 access. For immediate responses, please switch to Gemini 3.8 Flash or Gemini 3.1 Flash Lite.';
        } else {
          readableError = 'Rate limit reached or quota exhausted. Please retry shortly or check API key quota.';
        }
      } else if (rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED')) {
        readableError = 'Permission denied. Please ensure your GEMINI_API_KEY is active in Settings > Secrets.';
      } else if (rawMsg.includes('404')) {
        readableError = 'Requested model was not found or is unavailable for this key.';
      } else {
        readableError = rawMsg.slice(0, 300);
      }
    } catch {
      // safe fallback
    }

    res.write(`data: ${JSON.stringify({ error: readableError })}\n\n`);
    res.end();
  }
});

// Image Generation Endpoint with Rate Limiting (12 req/min per IP)
app.post('/api/image-generate', rateLimit(12), async (req: Request, res: Response): Promise<void> => {
  const ai = getGenAI();
  if (!ai) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server.' });
    return;
  }

  const { prompt, aspectRatio = '1:1' } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'Prompt is required for image generation.' });
    return;
  }

  if (prompt.length > 2500) {
    res.status(400).json({ error: 'Image prompt exceeds maximum limit of 2,500 characters.' });
    return;
  }

  const selectedRatio = ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : '1:1';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt.trim() }],
      },
      config: {
        imageConfig: {
          aspectRatio: selectedRatio as any,
        },
      },
    });

    let imageUrl: string | null = null;
    let descriptionText: string | null = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText = part.text;
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error: descriptionText || 'Model did not return image data.',
      });
      return;
    }

    res.json({
      imageUrl,
      prompt: prompt.trim(),
      description: descriptionText,
    });
  } catch (error: any) {
    let readableError = 'Failed to generate image via Gemini model.';
    const rawMsg = error?.message || '';

    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('limit: 0')) {
      readableError = 'Image generation requires a billing-enabled API key or has reached the quota limit. You can attach a billing-enabled Gemini API key in Settings > Secrets to unlock unlimited generation.';
    } else if (rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED')) {
      readableError = 'Permission denied for image generation. Please check your API key permissions.';
    } else if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
      readableError = 'The image generation model is experiencing high demand. Please try again shortly.';
    } else {
      readableError = rawMsg.slice(0, 300) || readableError;
    }

    res.status(400).json({ error: readableError });
  }
});

// Text-to-Speech Endpoint with Rate Limiting (25 req/min per IP)
app.post('/api/text-to-speech', rateLimit(25), async (req: Request, res: Response): Promise<void> => {
  const ai = getGenAI();
  if (!ai) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server.' });
    return;
  }

  const { text, voice = 'Kore' } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Text string is required for speech synthesis.' });
    return;
  }

  // Limit speech text length to 1000 characters for responsive streaming
  const trimmedText = text.trim().slice(0, 1000);
  const selectedVoice = ALLOWED_VOICES.has(voice) ? voice : 'Kore';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: trimmedText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice,
            },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio data returned by TTS model.' });
      return;
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    let readableError = 'TTS speech synthesis failed.';
    const rawMsg = error?.message || '';

    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      readableError = 'Voice synthesis quota exhausted. You can upgrade key in Settings > Secrets or use browser speech.';
    } else {
      readableError = rawMsg.slice(0, 300) || readableError;
    }

    res.status(400).json({ error: readableError });
  }
});

// Setup Vite dev server or static dist serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLACK GHOST AI server running securely on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err?.message || err);
  process.exit(1);
});
