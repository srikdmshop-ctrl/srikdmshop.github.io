Netlify deploy & configuration (quick guide)

Goal: deploy `netlify/functions/place_order.js` to Netlify so your frontend can POST orders (including payment screenshots) in the background.

1) Prepare repository
- Ensure `netlify/functions/place_order.js` exists in your repo (this repo already contains it).
- Commit and push to your GitHub (or other Git provider).

2) Create a Netlify site
- Go to https://app.netlify.com and "New site from Git".
- Connect your repository and pick the branch to deploy.

3) Add environment variables in Netlify (Site settings → Build & deploy → Environment)
- `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name (e.g., my-cloud)
- `CLOUDINARY_UPLOAD_PRESET` = your unsigned upload preset name
- `IMG_BB_KEY` = (optional) your imgbb API key (fallback)
- `WHATSAPP_PAGE_ACCESS_TOKEN` = (optional) WhatsApp Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID` = (optional) WhatsApp phone number id
- `SHOP_WHATSAPP_NUMBER` = (optional) recipient phone number in international format without + (e.g., 919876543210)

4) (Optional) Use Netlify CLI to set environment variables from terminal
- Install Netlify CLI: `npm i -g netlify-cli`
- Login: `netlify login`
- Link site (in repo root): `netlify link`
- Set env var using `netlify env:set` (you will be prompted for the value):

```bash
# set for the site linked to this repo
netlify env:set CLOUDINARY_CLOUD_NAME my-cloud
netlify env:set CLOUDINARY_UPLOAD_PRESET my_preset
netlify env:set IMG_BB_KEY your_imgbb_key
netlify env:set WHATSAPP_PAGE_ACCESS_TOKEN your_whatsapp_token
netlify env:set WHATSAPP_PHONE_NUMBER_ID your_phone_id
netlify env:set SHOP_WHATSAPP_NUMBER 919xxxxxxxxx
```

# To list environment variables for the site
netlify env:list

# To download env for local testing (creates .env)
netlify env:download

5) Frontend configuration
- Configure the frontend to POST to the Netlify function by adding this snippet somewhere before `</body>` in `index.html` (or hosting config):

```html
<script>
  // Netlify function path
  window.PLACE_ORDER_ENDPOINT = '/.netlify/functions/place_order';
</script>
```

6) Deploy & test
- After environment variables are set and the site deployed, go to your site, add items to cart, proceed to checkout, upload a screenshot and click "Place Order".
- The client will POST order + base64 screenshot to `/.netlify/functions/place_order`.
- If WhatsApp Cloud API is configured correctly, Netlify function will post the order text and the screenshot link to your shop WhatsApp number.
- If WhatsApp API is not configured, the function will return `uploadedUrl`; the client will then open the wa.me link including the image URL so you still receive payment proof.

Notes
- Do NOT commit your secret keys to the repository. Use Netlify environment variables.
- For production, consider using Cloudinary signed uploads or server-side validation to avoid abuse.
- If you need help obtaining WhatsApp Cloud API credentials, I can add instructions for that next.
