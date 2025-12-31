Serverless upload helper (Cloudinary)

This project includes a sample serverless function at `serverless/upload_cloudinary.js` that accepts a base64-encoded image and uploads it to Cloudinary using an unsigned `upload_preset`.

How to use

1. Create a Cloudinary account and an unsigned upload preset:
   - In the Cloudinary dashboard, upload presets -> Add upload preset -> uncheck "Require signed uploads".
   - Note the `upload_preset` name and your `cloud_name`.

2. Deploy the serverless upload endpoint (Vercel recommended):
    - Create an API route (for example `api/upload_cloudinary.js`) using the sample uploader `serverless/upload_cloudinary.js` included in this repo.
    - In Vercel Project Settings → Environment Variables, add:
       - `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name
       - `CLOUDINARY_UPLOAD_PRESET` = your unsigned preset name

3. Configure the frontend:
    - In the client (`index.html`) set `window.UPLOAD_ENDPOINT` (optional) to the deployed function URL, for example `/api/upload_cloudinary`.
    - Example (place before the closing `</body>` or in a config script):

       <script>
          window.UPLOAD_ENDPOINT = '/api/upload_cloudinary';
       </script>

4. Behavior:
   - When a user uploads a screenshot in the checkout flow, the client will POST the base64 image to the serverless endpoint.
   - The serverless function uploads to Cloudinary and returns the hosted image URL which will be included in the WhatsApp order message.

Notes & security

- Using an unsigned preset reduces security; do not use this preset for user-uploaded files you consider sensitive without additional validation.
- For higher security: implement a signed upload flow server-side using your Cloudinary API secret and generate upload signatures on the server.
- The sample function uses fetch and URLSearchParams to send the file as `file` with a data URL prefix. Adjust content-type handling as necessary for your platform.

Serverless order endpoint + WhatsApp delivery
-------------------------------------------

This repository also includes `serverless/place_order.js` — a sample function that:
- Accepts POSTed JSON with order details and a base64 `image` field.
- Uploads the image to Cloudinary (using unsigned `CLOUDINARY_UPLOAD_PRESET`) or falls back to imgbb.
- If you configure WhatsApp Cloud API env vars, it will send the order text and the screenshot image directly to your shop's WhatsApp number.

Environment variables for `place_order.js` (set these in your host/CI environment):
- `CLOUDINARY_CLOUD_NAME` — your Cloudinary cloud name (e.g. my-cloud)
- `CLOUDINARY_UPLOAD_PRESET` — unsigned upload preset name
- `IMG_BB_KEY` — (optional) imgbb API key fallback
- `WHATSAPP_PAGE_ACCESS_TOKEN` — (optional) WhatsApp Cloud API Page Access Token
- `WHATSAPP_PHONE_NUMBER_ID` — (optional) WhatsApp phone number id
- `SHOP_WHATSAPP_NUMBER` — (optional) recipient phone number in international format without + (e.g., 919876543210)

Quick CLI example (Vercel)

```bash
# login first
vercel login

# add variables for the production environment (you will be prompted to paste the value)
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_UPLOAD_PRESET production
vercel env add IMG_BB_KEY production
vercel env add WHATSAPP_PAGE_ACCESS_TOKEN production
vercel env add WHATSAPP_PHONE_NUMBER_ID production
vercel env add SHOP_WHATSAPP_NUMBER production
```

Frontend configuration
- Set `window.PLACE_ORDER_ENDPOINT` in your site to the deployed function URL (Vercel: `/api/place_order`).

Security note
- Never commit API keys or tokens to source control. Use platform environment variables or a secrets manager. The CLI commands above store env values securely in the hosting platform.

If you want, I can provide the exact commands to run locally to push your keys into Vercel (you will paste the secret string into the CLI prompt). I will not store any secrets in the repository.
