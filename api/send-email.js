export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { client_email, tracking_number, status, htmlBody } = req.body;

    if (!client_email || !htmlBody) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer re_N5op6iVA_5uKVo2oXyaWSjM89zQpifYo5",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Nexshipment <contact@meridiangrps.com>",
        to: client_email,
        subject: `Shipment Update: ${tracking_number} — ${status}`,
        html: htmlBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend Error:', data);
      return res.status(response.status).json({ error: data.message || 'Failed to send email', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
