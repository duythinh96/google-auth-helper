require('dotenv').config();
const express = require('express');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 9999;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper: encode/decode state to carry user-provided env safely through OAuth redirect
function encodeState(obj) {
  try {
    const b64 = Buffer.from(JSON.stringify(obj)).toString('base64');
    return encodeURIComponent(b64);
  } catch (e) {
    return '';
  }
}

function decodeState(str) {
  try {
    const jsonStr = Buffer.from(decodeURIComponent(str), 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function getOAuthClient(overrides = {}) {
  const clientId = overrides.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = overrides.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = overrides.redirectUri || process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Thiếu clientId/clientSecret. Cấu hình .env hoặc nhập thông tin env từ UI.');
  }

  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

let lastTokens = null;

app.get('/', (req, res) => {
  const envOk = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  res.render('index', { envOk, port: PORT });
});

// Update: accept user-provided env via query and propagate via state
app.get('/login', (req, res) => {
  try {
    const overrides = {
      clientId: req.query.client_id || undefined,
      clientSecret: req.query.client_secret || undefined,
      redirectUri: req.query.redirect_uri || undefined,
    };

    // Nếu thiếu client_id/client_secret và server không có ENV, hiển thị prompt để yêu cầu nhập
    const serverEnvMissing = !(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if ((!overrides.clientId || !overrides.clientSecret) && serverEnvMissing) {
      return res.status(200).send(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Nhập ENV</title></head><body><script>(function(){var clientId=sessionStorage.getItem('env:client_id')||prompt('Nhập GOOGLE_CLIENT_ID:');var clientSecret=sessionStorage.getItem('env:client_secret')||prompt('Nhập GOOGLE_CLIENT_SECRET:');var params=new URLSearchParams(window.location.search);var ru=sessionStorage.getItem('env:redirect_uri')||params.get('redirect_uri')||(location.origin+'/callback');if(clientId&&clientSecret){sessionStorage.setItem('env:client_id',clientId);sessionStorage.setItem('env:client_secret',clientSecret);sessionStorage.setItem('env:redirect_uri',ru);var qs=new URLSearchParams({client_id:clientId,client_secret:clientSecret,redirect_uri:ru}).toString();location.replace('/login?'+qs);}else{alert('Thiếu thông tin ENV. Vui lòng nhập đầy đủ.');location.replace('/');}})();</script></body></html>`);
    }

    const oauth2Client = getOAuthClient(overrides);
    const scopes = ['openid', 'email', 'profile'];

    let state;
    if (overrides.clientId && overrides.clientSecret) {
      state = encodeState({
        clientId: overrides.clientId,
        clientSecret: overrides.clientSecret,
        redirectUri: overrides.redirectUri || undefined,
      });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // cố gắng lấy refresh_token
      prompt: 'consent',      // buộc hiện consent để lấy refresh_token lần đầu
      scope: scopes,
      state,
    });
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Route: login với quyền Google Drive
app.get('/drive', (req, res) => {
  try {
    const overrides = {
      clientId: req.query.client_id || undefined,
      clientSecret: req.query.client_secret || undefined,
      redirectUri: req.query.redirect_uri || undefined,
    };

    const serverEnvMissing = !(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if ((!overrides.clientId || !overrides.clientSecret) && serverEnvMissing) {
      return res.status(200).send(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Nhập ENV</title></head><body><script>(function(){var clientId=sessionStorage.getItem('env:client_id')||prompt('Nhập GOOGLE_CLIENT_ID:');var clientSecret=sessionStorage.getItem('env:client_secret')||prompt('Nhập GOOGLE_CLIENT_SECRET:');var params=new URLSearchParams(window.location.search);var ru=sessionStorage.getItem('env:redirect_uri')||params.get('redirect_uri')||(location.origin+'/callback');if(clientId&&clientSecret){sessionStorage.setItem('env:client_id',clientId);sessionStorage.setItem('env:client_secret',clientSecret);sessionStorage.setItem('env:redirect_uri',ru);var qs=new URLSearchParams({client_id:clientId,client_secret:clientSecret,redirect_uri:ru}).toString();location.replace('/drive?'+qs);}else{alert('Thiếu thông tin ENV. Vui lòng nhập đầy đủ.');location.replace('/');}})();</script></body></html>`);
    }

    const oauth2Client = getOAuthClient(overrides);
    const scopes = [
      'openid','email','profile',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    let state;
    if (overrides.clientId && overrides.clientSecret) {
      state = encodeState({
        clientId: overrides.clientId,
        clientSecret: overrides.clientSecret,
        redirectUri: overrides.redirectUri || undefined,
      });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
    });
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Thiếu mã code từ Google callback');

  try {
    let overrides;
    if (req.query.state) {
      const parsed = decodeState(req.query.state);
      if (parsed && parsed.clientId && parsed.clientSecret) {
        overrides = {
          clientId: parsed.clientId,
          clientSecret: parsed.clientSecret,
          redirectUri: parsed.redirectUri || undefined,
        };
      }
    }

    const oauth2Client = getOAuthClient(overrides);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    lastTokens = tokens;
    res.render('tokens', { tokens });
  } catch (err) {
    console.error('Lỗi trao đổi code lấy token:', err);
    res.status(500).send('Không thể trao đổi code để lấy token. Vui lòng thử lại.');
  }
});

app.get('/tokens.json', (req, res) => {
  if (!lastTokens) return res.status(404).json({ error: 'Chưa có token nào. Hãy đăng nhập Google trước.' });
  res.json(lastTokens);
});

app.get('/health-check', (req, res) => {
  const envOk = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    envConfigured: envOk,
  });
});

app.listen(PORT, () => {
  console.log(`Google Auth Helper đang chạy tại http://localhost:${PORT}`);
});