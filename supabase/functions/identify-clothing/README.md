# identify-clothing

Supabase Edge Function that analyzes a clothing photo with **OpenAI GPT-4o-mini** vision and returns structured wardrobe attributes.

## Deploy

```bash
# one-time
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# secret stays on the server — never put this in the Expo app
supabase secrets set OPENAI_API_KEY=sk-...

supabase functions deploy identify-clothing
```

## Request

```http
POST /functions/v1/identify-clothing
Authorization: Bearer <user_or_anon_jwt>
apikey: <anon_key>
Content-Type: application/json

{ "imageUrl": "https://..." }
# or
{ "imageBase64": "...", "mimeType": "image/jpeg" }
```

## Response

```json
{
  "result": {
    "matched": true,
    "suggestedName": "Sage Linen Shirt",
    "confidence": 0.91,
    "attributes": {
      "category": "Tops",
      "color": "Sage green",
      "pattern": "Solid",
      "material": "Linen",
      "style": "Relaxed",
      "occasion": "Casual"
    }
  },
  "provider": "openai:gpt-4o-mini"
}
```
