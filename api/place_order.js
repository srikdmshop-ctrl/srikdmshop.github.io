// Vercel API route: accepts order details + base64 image, uploads to Cloudinary (unsigned preset) or imgbb fallback,
// then sends the order details + image to the shop owner's WhatsApp using the WhatsApp Cloud API (if configured).
// Place this file at `api/place_order.js` and deploy to Vercel. Set environment variables in Vercel dashboard.

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { customer, payment, items, subtotal, total, image } = req.body || {};
    if (!customer || !items || !image) return res.status(400).json({ error: 'Missing fields' });

    // Upload image to Cloudinary (unsigned preset)
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || null;
    const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || null;
    let uploadedUrl = null;

    if (CLOUD_NAME && UPLOAD_PRESET) {
      const form = new URLSearchParams();
      form.append('file', `data:image/jpeg;base64,${image}`);
      form.append('upload_preset', UPLOAD_PRESET);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`;
      const cloudRes = await fetch(cloudUrl, { method: 'POST', body: form });
      const cloudJson = await cloudRes.json();
      if (cloudRes.ok && cloudJson && (cloudJson.secure_url || cloudJson.url)) uploadedUrl = cloudJson.secure_url || cloudJson.url;
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
      await fetch(`https://graph.facebook.com/v17.0/${WA_PHONE_ID}/messages`, {
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

      return res.status(200).json({ success: true, message: 'Order sent to WhatsApp shop number.' });
    }

    // If no WhatsApp API, return uploaded URL so client can open wa.me including link
    return res.status(200).json({ success: true, uploadedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
