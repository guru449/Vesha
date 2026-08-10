// Supabase Edge Function — clothing recognition via OpenAI vision.
// Secrets: OPENAI_API_KEY
// Deploy: supabase functions deploy identify-clothing

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type ClothingCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Dresses'
  | 'Shoes'
  | 'Jewelry'
  | 'Accessories';

type MatchedResult = {
  matched: true;
  suggestedName: string;
  confidence: number;
  attributes: {
    category: ClothingCategory;
    color: string;
    pattern: string;
    material: string;
    style: string;
    occasion: string;
    brand?: string;
  };
};

type UnmatchedResult = {
  matched: false;
  confidence: number;
  reason: string;
};

type IdentifyResult = MatchedResult | UnmatchedResult;

const SYSTEM_PROMPT = `You are Vesha's clothing recognition engine.
Analyze the photo and identify the single primary clothing / fashion item.

Return ONLY valid JSON matching one of these shapes:

Success:
{
  "matched": true,
  "suggestedName": "short product-style name",
  "confidence": 0.0-1.0,
  "attributes": {
    "category": "Tops|Bottoms|Dresses|Shoes|Jewelry|Accessories",
    "color": "plain language color",
    "pattern": "e.g. Solid, Striped, Floral",
    "material": "best guess fabric/material",
    "style": "short style descriptor",
    "occasion": "Casual|Work|Brunch|Evening|Travel|Everyday|Smart casual",
    "brand": "only if clearly visible, else omit"
  }
}

No clear clothing item:
{
  "matched": false,
  "confidence": 0.0-1.0,
  "reason": "short user-facing explanation"
}

Rules:
- category MUST be one of the allowed values.
- Prefer the dominant wearable item if multiple appear.
- Be concise; no markdown.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeCategory(raw: string): ClothingCategory {
  const value = (raw || '').trim().toLowerCase();
  if (value.startsWith('top')) return 'Tops';
  if (value.startsWith('bottom') || value.includes('pant') || value.includes('skirt')) {
    return 'Bottoms';
  }
  if (value.startsWith('dress')) return 'Dresses';
  if (value.startsWith('shoe') || value.includes('boot') || value.includes('sneaker')) {
    return 'Shoes';
  }
  if (value.startsWith('jewel') || value.includes('earring') || value.includes('necklace')) {
    return 'Jewelry';
  }
  return 'Accessories';
}

function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function parseModelJson(content: string): IdentifyResult {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  if (parsed.matched === false) {
    return {
      matched: false,
      confidence: clampConfidence(parsed.confidence),
      reason:
        typeof parsed.reason === 'string' && parsed.reason.trim()
          ? parsed.reason.trim()
          : 'No clear clothing item was detected.',
    };
  }

  const attributes = (parsed.attributes || {}) as Record<string, unknown>;
  return {
    matched: true,
    suggestedName:
      typeof parsed.suggestedName === 'string' && parsed.suggestedName.trim()
        ? parsed.suggestedName.trim()
        : 'New piece',
    confidence: clampConfidence(parsed.confidence),
    attributes: {
      category: normalizeCategory(String(attributes.category || 'Accessories')),
      color: String(attributes.color || 'Unknown'),
      pattern: String(attributes.pattern || 'Unknown'),
      material: String(attributes.material || 'Unknown'),
      style: String(attributes.style || 'Unknown'),
      occasion: String(attributes.occasion || 'Everyday'),
      brand:
        typeof attributes.brand === 'string' && attributes.brand.trim()
          ? attributes.brand.trim()
          : undefined,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return jsonResponse(
        { error: 'OPENAI_API_KEY is not configured on the Edge Function' },
        500,
      );
    }

    // Prefer authenticated callers when a JWT is present; still allow anon for demo.
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');
    if (supabaseUrl && supabaseAnon && authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      await supabase.auth.getUser();
    }

    const body = await req.json();
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : null;
    const imageBase64 =
      typeof body.imageBase64 === 'string' ? body.imageBase64 : null;
    const mimeType =
      typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg';

    if (!imageUrl && !imageBase64) {
      return jsonResponse(
        { error: 'Provide imageUrl or imageBase64' },
        400,
      );
    }

    const imageContent = imageUrl
      ? { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
      : {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: 'low',
          },
        };

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify the clothing item in this photo for a digital wardrobe.',
              },
              imageContent,
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error', errText);
      return jsonResponse(
        { error: 'Vision provider failed', detail: errText.slice(0, 400) },
        502,
      );
    }

    const openaiJson = await openaiRes.json();
    const content = openaiJson?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return jsonResponse({ error: 'Empty model response' }, 502);
    }

    const result = parseModelJson(content);
    return jsonResponse({ result, provider: 'openai:gpt-4o-mini' });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      500,
    );
  }
});
