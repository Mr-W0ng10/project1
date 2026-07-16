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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'vault_media',
      resource_type: 'auto',
      tags: req.body.person // 這裡會抓取前端傳來的對象 (lou, peter, yuan)
    };
  },
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 重要：確保伺服器知道 public 資料夾在哪
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ 
    secret: 'secure-vault-key', 
    resave: false, 
    saveUninitialized: true 
}));

// 登入驗證
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin999' && pass === '12345678') {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// 上傳檔案
app.post('/api/upload', (req, res, next) => {
    if (!req.session.isAdmin) return res.status(403).send('Unauthorized');
    next();
}, upload.single('file'), (req, res) => {
    res.send('Successfully Uploaded!');
});

// 獲取檔案清單
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

// 指向主頁面 (防止手機出現 Not Found)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 修改這裡以適應 Render 
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is Live on port ${PORT}`);
});