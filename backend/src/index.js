require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Cấu hình middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình kết nối MySQL Laragon
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Sử dụng Promise wrapper để tiện dùng async/await
const db = pool.promise();

// Route kiểm tra kết nối DB
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Kết nối Express và Database web thành công!', solution: rows[0].solution });
  } catch (error) {
    console.error('Lỗi khi kết nối database:', error);
    res.status(500).json({ error: 'Không thể kết nối với database', details: error.message });
  }
});

// Route test việc lấy danh sách user từ bảng user
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, user, email FROM user');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu từ bảng user' });
  }
});

// Route đăng ký - Hoàn thiện với Bcrypt và bắt lỗi trùng lặp
app.post('/api/register', async (req, res) => {
  try {
    const { user, password, email } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!user || !password || !email) {
      return res.status(400).json({ error: 'Vui lòng điền đủ thông tin (user, email, password)' });
    }

    // Kiểm tra xem email hoặc user đã tồn tại chưa
    const [existingUsers] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email này đã được đăng ký' });
    }

    // Mã hóa mật khẩu với bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu vào database
    const [result] = await db.query(
      'INSERT INTO user (user, password, email) VALUES (?, ?, ?)',
      [user, hashedPassword, email]
    );

    res.status(201).json({ 
      message: 'Đăng ký thành công', 
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký' });
  }
});

// Route đăng nhập - Hoàn thiện với Bcrypt và JWT Token
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu' });
    }
    
    // Tìm user bằng email
    const [rows] = await db.query('SELECT id, user, email, password FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }
    
    const userRecord = rows[0];
    
    // So sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa trong DB
    const validPassword = await bcrypt.compare(password, userRecord.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }
    
    // Tạo JWT Token sau khi đăng nhập thành công
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, user: userRecord.user },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1h' } // Token sống trong 1 giờ
    );
    
    res.json({ 
      message: 'Đăng nhập thành công', 
      token: token,
      user: { 
        id: userRecord.id, 
        username: userRecord.user, 
        email: userRecord.email 
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập' });
  }
});

app.listen(port, () => {
  console.log(`Server Express đang chạy tại: http://localhost:${port}`);
  console.log('Test DB connection: http://localhost:3000/');
});
