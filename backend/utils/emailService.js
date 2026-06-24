const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const sendEntryPass = async (registration, event) => {
  try {
    const { name, email, unique_code, department, semester } = registration;
    const eventTitle = event.title;
    
    // Format Event Date
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const venue = event.venue || 'Virtual / Online';
    
    // 1. Generate QR Code
    const qrcodeDataUrl = await QRCode.toDataURL(unique_code, {
      margin: 1,
      width: 300,
    });
    
    // Save locally for testing/verification
    const sentPassesDir = path.join(__dirname, '..', 'sent_passes');
    if (!fs.existsSync(sentPassesDir)) {
      fs.mkdirSync(sentPassesDir, { recursive: true });
    }
    
    // Save QR Code image locally
    const base64Data = qrcodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrPath = path.join(sentPassesDir, `${unique_code}_qr.png`);
    fs.writeFileSync(qrPath, base64Data, 'base64');
    
    // 2. Render beautiful HTML Pass
    const passHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Event Entry Pass</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="padding: 40px 20px;">
    <div style="background: #0d1527; color: #ffffff; padding: 30px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
        <h2 style="margin: 0; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; font-size: 20px; font-weight: 700;">Event Entry Pass</h2>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Smart Event Registration + Attendance System</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 5px 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">${eventTitle}</h3>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">College Event Console</p>
      </div>
      
      <div style="background: rgba(255,255,255,0.01); border: 1px solid #273549; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; font-weight: 500; width: 40%;">Attendee Name</td>
            <td style="padding: 6px 0; color: #ffffff; font-size: 14px; font-weight: 700; text-align: right;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Affiliation</td>
            <td style="padding: 6px 0; color: #ffffff; font-size: 14px; text-align: right;">${department || 'N/A'} ${semester ? `(${semester})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Date</td>
            <td style="padding: 6px 0; color: #ffffff; font-size: 14px; text-align: right;">${eventDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Venue</td>
            <td style="padding: 6px 0; color: #ffffff; font-size: 14px; text-align: right; font-weight: 600;">${venue}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; background: rgba(59, 130, 246, 0.03); border: 1px dashed #3b82f6; border-radius: 12px; padding: 25px;">
        <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Scan QR Code at the Entrance</p>
        <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
          <img src="cid:qrcode" alt="QR Code" style="display: block; width: 160px; height: 160px;" />
        </div>
        <div style="font-family: monospace; font-size: 22px; font-weight: 700; color: #3b82f6; letter-spacing: 4px;">
          ${unique_code}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 25px; color: #64748b; font-size: 12px; line-height: 1.4;">
        Please keep this email safe. You will need to show this QR code at the registration desk to record your attendance.
      </div>
    </div>
  </div>
</body>
</html>`;

    // Save HTML pass locally
    const htmlPath = path.join(sentPassesDir, `${unique_code}.html`);
    fs.writeFileSync(htmlPath, passHtml, 'utf8');
    console.log(`[EmailService] Entry Pass saved locally to: ${htmlPath}`);

    // 3. Configure Nodemailer Transporter
    let transporter;
    let isMock = false;

    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[EmailService] Using configured SMTP server for delivery.');
    } else {
      isMock = true;
      // Generate Ethereal SMTP credentials
      console.log('[EmailService] No SMTP configured. Creating Ethereal mock test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Ethereal mock account created: ${testAccount.user}`);
    }

    // 4. Send the Mail
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Event Entry Pass" <noreply@college-events.edu>',
      to: email,
      subject: `Your Entry Pass for ${eventTitle}`,
      html: passHtml,
      attachments: [{
        filename: 'qrcode.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode',
      }],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email successfully sent to ${email}. Message ID: ${info.messageId}`);

    if (isMock) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService] ✉️ MOCK EMAIL PREVIEW URL: ${previewUrl}`);
      
      // Save Ethereal preview URL to a local metadata file so it can be verified easily by test scripts
      const metaPath = path.join(sentPassesDir, `${unique_code}_meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify({
        email: email,
        unique_code: unique_code,
        messageId: info.messageId,
        previewUrl: previewUrl,
        sentAt: new Date().toISOString()
      }, null, 2), 'utf8');
    }
  } catch (error) {
    console.error('[EmailService] Error generating/sending entry pass:', error);
  }
};

module.exports = {
  sendEntryPass,
};
