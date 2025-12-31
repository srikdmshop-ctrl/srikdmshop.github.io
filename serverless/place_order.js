// Serverless function: accepts order details + base64 image, uploads to Cloudinary (unsigned preset) or imgbb fallback,
// then sends the order details + image to the shop owner's WhatsApp using the WhatsApp Cloud API (if configured).
// Recommended deployment: Vercel (place as `api/place_order.js`). Set environment variables in your Vercel project.

// Required environment variables (for Cloudinary unsigned upload):
// - CLOUDINARY_CLOUD_NAME
// - CLOUDINARY_UPLOAD_PRESET
// For WhatsApp Cloud API (optional, to send messages automatically):
// - WHATSAPP_PAGE_ACCESS_TOKEN
// - WHATSAPP_PHONE_NUMBER_ID
// - SHOP_WHATSAPP_NUMBER (recipient, in international format without +, e.g., 919876543210)

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    const body = JSON.parse(event.body || '{}');
    const { customer, payment, items, subtotal, total, image } = body;
    if (!customer || !items || !image) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };

    // Upload image to Cloudinary (unsigned preset)
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || null;
    const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || null;
    let uploadedUrl = null;

    if (CLOUD_NAME && UPLOAD_PRESET) {
      const form = new URLSearchParams();
      form.append('file', `data:image/jpeg;base64,${image}`);
      form.append('upload_preset', UPLOAD_PRESET);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`;
      const res = await fetch(cloudUrl, { method: 'POST', body: form });
      const json = await res.json();
      if (res.ok && json && (json.secure_url || json.url)) uploadedUrl = json.secure_url || json.url;
    }

    // Fallback to imgbb if configured
    if (!uploadedUrl && process.env.IMG_BB_KEY) {
      const key = process.env.IMG_BB_KEY;
      const form = new URLSearchParams();
      form.append('key', key);
      form.append('image', image);
      const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
      const j = await r.json();
      if (r.ok && j && j.data && j.data.url) uploadedUrl = j.data.url;
    }

    // Build text message
    const orderLines = items.map(i => `${i.name} x${i.qty} - ₹${i.price * i.qty}`).join('\n');
    let text = `*🛒 New Order*\n\n*Items:*\n${orderLines}\n\n*Payment:* ${payment.mode}\n*Customer:* ${customer.name} (${customer.mobile})\n*Address:* ${customer.address}\n\n*Notes:* ${payment.notes || '-'}\n*Total:* ₹${total}`;

    // If WhatsApp Cloud API configured, send text and image to shop number
    const WA_TOKEN = process.env.WHATSAPP_PAGE_ACCESS_TOKEN || null;
    const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
    const SHOP_NUMBER = process.env.SHOP_WHATSAPP_NUMBER || null;

    if (WA_TOKEN && WA_PHONE_ID && SHOP_NUMBER) {
      // Send text message
      const textRes = await fetch(`https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WA_TOKEN}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: SHOP_NUMBER, type: 'text', text: { body: text } })
      });

      // If we have uploadedUrl, send image message referencing link
      if (uploadedUrl) {
        await fetch(`https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WA_TOKEN}` },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: SHOP_NUMBER, type: 'image', image: { link: uploadedUrl } })
        });
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Order sent to WhatsApp shop number.' }) };
    }

    // If no WhatsApp API, return uploaded URL so client can open wa.me including link
    return { statusCode: 200, body: JSON.stringify({ success: true, uploadedUrl }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
