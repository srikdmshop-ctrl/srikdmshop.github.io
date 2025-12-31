Serverless upload helper (Cloudinary)

This project includes a sample serverless function at `serverless/upload_cloudinary.js` that accepts a base64-encoded image and uploads it to Cloudinary using an unsigned `upload_preset`.

How to use

1. Create a Cloudinary account and an unsigned upload preset:
   - In the Cloudinary dashboard, upload presets -> Add upload preset -> uncheck "Require signed uploads".
   - Note the `upload_preset` name and your `cloud_name`.

2. Deploy the serverless function (Netlify / Vercel / any serverless platform):
   - For Netlify place `upload_cloudinary.js` in `netlify/functions/` (or configure build to pick `serverless/`), and set environment variables in Netlify UI:
     - `CLOUDINARY_CLOUD_NAME` = your cloud name
     - `CLOUDINARY_UPLOAD_PRESET` = your unsigned preset name

   - For Vercel create an API route (e.g., `api/upload_cloudinary.js`) with the same contents and set environment variables in the Vercel dashboard.

3. Configure the frontend:
   - In the client (this `index.html`) set `window.UPLOAD_ENDPOINT` to the deployed function URL (e.g., `/.netlify/functions/upload_cloudinary` or `/api/upload_cloudinary`).
   - Example (place before the closing `</body>` or in a config script):

     <script>
       window.UPLOAD_ENDPOINT = '/.netlify/functions/upload_cloudinary';
     </script>

4. Behavior:
   - When a user uploads a screenshot in the checkout flow, the client will POST the base64 image to the serverless endpoint.
   - The serverless function uploads to Cloudinary and returns the hosted image URL which will be included in the WhatsApp order message.

Notes & security

- Using an unsigned preset reduces security; do not use this preset for user-uploaded files you consider sensitive without additional validation.
- For higher security: implement a signed upload flow server-side using your Cloudinary API secret and generate upload signatures on the server.
- The sample function uses fetch and URLSearchParams to send the file as `file` with a data URL prefix. Adjust content-type handling as necessary for your platform.
