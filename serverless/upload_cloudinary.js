// Sample serverless function for Netlify / Vercel that accepts a base64 image and uploads to Cloudinary
// Save this file as serverless/upload_cloudinary.js and deploy as a serverless function.
// Environment variables required:
// - CLOUDINARY_CLOUD_NAME
// - CLOUDINARY_UPLOAD_PRESET

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { image } = body; // base64 string without data:*/*;base64, prefix
    if (!image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image provided' }) };
    }

    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary not configured on server' }) };
    }

    // Prepare form data for Cloudinary unsigned upload
    const formData = new URLSearchParams();
    formData.append('file', `data:image/jpeg;base64,${image}`);
    formData.append('upload_preset', UPLOAD_PRESET);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`;

    const res = await fetch(cloudUrl, { method: 'POST', body: formData });
    const json = await res.json();

    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed', details: json }) };
    }

    // Return the Cloudinary response (secure_url etc.)
    return {
      statusCode: 200,
      body: JSON.stringify({ url: json.secure_url || json.url, raw: json })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
