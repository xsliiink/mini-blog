import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {dirname} from 'path';
import fs from 'fs';
import cors from 'cors';
import bcrypt from 'bcrypt';
import wbt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadPath = path.join(__dirname,'uploads');
const app = express();
const storage = multer.diskStorage({
  destination: function (req,file,cb){
    cb(null,uploadPath);
  },
  filename: (req,file,cb) =>{
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
    cb(null,uniqueName);
  }
})
const upload = multer({ storage});

// app.use((req,res,next) => {
//   console.log('➡️ Request:', req.method, req.url);
//   if (req.method !== 'GET') {
//     console.log('📦 Body:', req.body);
//   }
//   next();
// });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((req,res,next) => {
  console.log('➡️ Request:', req.method, req.url);
  if (req.method !== 'GET') {
    console.log('📦 Body:', req.body);
  }
  next();
});

function authMiddleware(req,res,next){
  const authHeader = req.headers['authorization'];//достаем заголовок authorization
  if(!authHeader) return res.status(401).json({error: 'No token'});

  const token = authHeader.split(' ')[1];//токен состоит из двух частей: 'Bearer ' + токен, поэтому мы берем второй элемент массива
  if (!token) return res.status(401).json({error: 'No token'});

  try{
    const decoded = wbt.verify(token,process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }catch(err){
    return res.status(403).json({error: 'Invalid token'})
  }
}


//создаем таблицу в базе данных
let db;
(async () => {
  db = await open({
    filename: './messages.db',
    driver: sqlite3.Database
  });

  await db.run(`CREATE TABLE IF NOT EXISTS messages(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      filename TEXT

  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS comments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT,
    FOREIGN KEY (post_id) REFERENCES messages (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
    )`)

    await db.run(`CREATE TABLE IF NOT EXISTS post_likes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(post_id,user_id),
      FOREIGN KEY (post_id) REFERENCES messages (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
      )`)

  await db.run(`CREATE TABLE IF NOT EXISTS forum_messages(
    text TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users (id)
    
    )`)
  
})();

app.get('/api/posts', async (req, res) => {//когда кто-то сделает fetch запрос,то выполнится эта функция
  try{
    const posts = await db.all(`
   SELECT 
      m.id,
      m.text,
      m.filename,
      COUNT(pl.id) AS likes
  FROM messages m
  LEFT JOIN post_likes pl ON pl.post_id = m.id
  GROUP BY m.id
  ORDER BY m.id DESC
    `);//db.all - SQL метод,для получения всех строк из таблицы
  res.json(posts);
  }catch(err){
    console.error('GET /api/posts error:',err);
    res.status(500).json({error:'Internal server error'});
  }
});

app.get('/api/forum',async (req,res) => {
  try{
    const forumMessages = await db.all(`
      SELECT fm.id, fm.text, fm.created_at, u.username
      FROM forum_messages fm
      JOIN users u ON fm.user_id = u.id
      ORDER BY fm.created_at ASC
      `);
    res.json(forumMessages);
  }catch(err){
    console.error('Failed to retrieve forum messages',err);
    res.status(500).json({error:'Internal server error'});
  }
})

app.post('/api/posts',upload.single('file'),async (req,res) => {
  const {text} = req.body;
  const file = req.file;

  console.log('Uploaded file info:', req.file);

  const filename = file ? file.filename : null;

  const result = await db.run(
    `INSERT INTO messages (text,filename) VALUES (?,?)`,
    [text, filename]
  );

  res.json({id: result.lastID, text, filename});
});

app.patch('/api/posts/:id/like',async(req,res) => {
  try{
    const {id} = req.params;//возьми из URL номер поста,id
    await db.run(
      `UPDATE messages SET likes = COALESCE(likes,0) + 1 where id  = ?`,
      [id]
    );
    const row  = await db.get( //получи обновленные данные этого поста из базы,чтобы знать сколько лайков стало
      `SELECT id,text,COALESCE(likes,0) AS likes, created_at
        FROM messages WHERE id = ?`,
        [id]
    );
    if(!row) {
      return res.status(404).json({error:'Post not found'})
    }
    res.json(row);  
  }
  catch(error){
    console.error('PATCH/posts/:id/like error:',err);
    res.status(500).json({error: 'server error'});
  }
})

app.patch('/api/posts/:id/like2',authMiddleware, async(req,res) => {
  const {id: post_id} = req.params;
  const user_id = req.user.id;

  try{
    const existing = await db.get(`
        SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?`,[post_id,user_id]
      );

      if(existing){
          await db.run(
            `DELETE FROM post_likes WHERE id = ?`,[existing.id]
          );
      } else{
        await db.run(
          `INSERT INTO post_likes (post_id,user_id) VALUES (?,?)`,
          [post_id,user_id]
        );
      }

      const likesCount = await db.get(
        `SELECT COUNT(*) AS likes FROM post_likes WHERE post_id = ?`,
        [post_id]
      );
      
      res.json({post_id,likes: likesCount.likes});
  }catch(err){
          console.error('PATCH/posts/:id/like error:',err);
        }
});

app.post('/api/posts/:id/comment',authMiddleware, async(req,res) => {
  try{
    const {id : post_id} = req.params;
    const {text} = req.body;
    const user_id = req.user.id;

  if (!text || !user_id){
    return res.status(400).json({error : 'Missing text or user_id'});
  }

  const post = await db.get(`SELECT * FROM messages WHERE id = ?`,[post_id]);
  if (!post) return res.status(404).json({error : 'Post not found'});


  const result = await db.run(
    `INSERT INTO COMMENTS (post_id,user_id,text) VALUES (?,?,?)`,
    [post_id,user_id,text]
  );

  const comment = await db.get(`SELECT * FROM comments WHERE id = ?`,[result.lastID]);
  res.json(comment)
  }catch(err){
    console.error('POST/posts/:id/comment error:',err);
    res.status(500).json({error:'server error'})
  }
})

app.get('/api/posts/:id/comment',async (req,res) => {
  try{
    const { id : post_id} = req.params;//переменовыввем id в post_id для удобства
    const comments = await db.all(
      `SELECT c.id,c.text,c.user_id,u.username
      from comments c 
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id =  ?`,
      [post_id]
    );
    res.json(comments);
  }catch(err){
    console.error('GET/posts/:id/comment error:',err);
    res.status(500).json({error:'server error'})
  }
})

app.post('/api/forum',authMiddleware,async (req,res) =>{
  try{
    const {id : comment_id} = req.params;
    const user_id = req.user.id;
    const {text} = req.body;

    if(!text || !user_id){
      return res.status(400).json({error: 'Missing text or user_id'});
    }

    const result = await db.run(
      `INSERT INTO forum_messages (user_id,text) VALUES (?,?)`,
      [user_id,text]
    );

    res.json({
      id : result.lastID,
      user_id,
      text,
      created_at : new Date().toISOString()
    });
  }catch(err){
    console.error('Error inserting forum message:',err);
    res.status(500).json({error: 'Internal server error'})
  }
  
});

app.post('/api/register', async (req,res) =>{
  const {userName,password} = req.body;

  if (!userName || !password){
    return res.status(400).json({error : 'Fill out all the fields'});
  }

  const existingUser = await db.get(`SELECT * FROM users WHERE username = ?`,[userName]);
  if(existingUser){
    return res.status(400).json({error: 'user already exists'});
  }

  const hashedPassword = await bcrypt.hash(password,10);

  await db.run(`INSERT INTO users (username,password) VALUES (?,?)`,[userName,hashedPassword])

  res.json({message: 'user created!'});
})

app.post('/api/login', async (req,res) => {
  try{
    const {userName,password} = req.body;
    console.log('BODY:',req.body)

  if(!userName || !password){
    return res.status(400).json({error: 'Fill out all the fields'});
  }


  //looking for user in db
  const user = await db.get(`SELECT * FROM users WHERE username = ?`,[userName]);
  console.log('user:',user)
  if (!user){
    return res.status(400).json({message: 'User not found'});
  }

  const isMatch = await bcrypt.compare(password,user.password);
  console.log('isMatch:',isMatch);
  if(!isMatch){
    return res.status(400).json({message : 'Invalid password'});
  }


  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  const token = wbt.sign(
    {id : user.id,userName: user.username},
    process.env.JWT_SECRET,
    {expiresIn: '1h'}
  );
  console.log('Generated token:', token);

  res.json({token});
  }catch(err){
    console.error('Login Error:',err);
    res.status(500).json({error: 'Server error'})
  }
})

app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.run('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /posts/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
