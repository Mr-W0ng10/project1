const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const session = require('express-session');
const path = require('path');

const app = express();

// 你的 Cloudinary 配置
cloudinary.config({ 
  cloud_name: 'zbbtbbtx', 
  api_key: '796263538645272', 
  api_secret: 'pOTVzwvxDOQ57PVpL_re7qgqdz8' 
});

// 設定 Multer 儲存引擎
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'vault_media',
      resource_type: 'auto',
      tags: req.body.person // 上傳時自動掛上對象標籤
    };
  },
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ 
    secret: 'vault-system-secret', 
    resave: false, 
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 登入有效期 1 小時
}));

// 登入驗證 - 密碼留在後端，前端看不到
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin999' && pass === '12345678') {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// 上傳檔案 API
app.post('/api/upload', (req, res, next) => {
    if (!req.session.isAdmin) return res.status(403).send('Unauthorized');
    next();
}, upload.single('file'), (req, res) => {
    res.send('Successfully Uploaded to Cloudinary!');
});

// 獲取媒體清單 API (同時抓取照片與影片)
app.get('/api/media/:tag', async (req, res) => {
    try {
        const tag = req.params.tag;
        const [imgs, vids] = await Promise.all([
            cloudinary.api.resources_by_tag(tag, { resource_type: 'image' }),
            cloudinary.api.resources_by_tag(tag, { resource_type: 'video' })
        ]);
        res.json([...imgs.resources, ...vids.resources]);
    } catch (e) {
        res.json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));