Vercel deploy & configuration (quick guide)

Goal: deploy `api/place_order.js` to Vercel so your frontend can POST orders (including payment screenshots) in the background.

1) Prepare repository
- Ensure `api/place_order.js` exists in your repo (this repo now contains it).
- Commit and push to your GitHub (or other Git provider).

2) Create a Vercel project
- Go to https://vercel.com and create a new project from Git.
- Select your repository and follow the deploy prompts.

3) Add Environment Variables in Vercel (Project Settings → Environment Variables)
- `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name (e.g., my-cloud)
- `CLOUDINARY_UPLOAD_PRESET` = your unsigned upload preset name
- `IMG_BB_KEY` = (optional) your imgbb API key (fallback)
- `WHATSAPP_PAGE_ACCESS_TOKEN` = (optional) WhatsApp Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID` = (optional) WhatsApp phone number id
- `SHOP_WHATSAPP_NUMBER` = (optional) recipient phone number in international format without + (e.g., 919876543210)

CLI: set env via Vercel CLI (recommended if you prefer terminal)

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

# To list environment variables for the project
vercel env ls

# To pull environment variables to a local .env file (for local testing):
vercel env pull .env
```

4) Frontend configuration
- Set this snippet before `</body>` in `index.html` (or in your settings):

```html
<script>
  // Vercel API path
  window.PLACE_ORDER_ENDPOINT = '/api/place_order';
</script>
```

5) Deploy & test
- After environment variables are set and the project deploys, open your site, add items to cart, upload a screenshot and click "Place Order".
- The client will POST order + base64 screenshot to `/api/place_order`.
- If WhatsApp Cloud API is configured correctly, the server will post the order text and the screenshot link to your shop WhatsApp number.
- If WhatsApp API is not configured, the function returns `uploadedUrl` and the client will fallback to opening the wa.me link including the image URL.

Notes
- Do NOT commit your secret keys to the repository. Use Vercel environment variables.
- For production, prefer Cloudinary signed uploads or server-side validation to avoid abuse.
- If you want, I can help configure the WhatsApp Cloud API step-by-step.
