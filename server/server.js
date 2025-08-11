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

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



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
      likes INTEGER DEFAULT 0,
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
      type TEXT CHECK(type IN ('like','dislike')),
      UNIQUE(post_id,user_id)
      FOREIGN KEY (post_id) REFERENCES messages (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
      )`)
  
})();

app.get('/posts', async (req, res) => {//когда кто-то сделает fetch запрос,то выполнится эта функция
  const posts = await db.all(`SELECT * FROM messages`);//db.all - SQL метод,для получения всех строк из таблицы
  res.json(posts);
});

app.post('/posts',upload.single('file'),async (req,res) => {
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

app.patch('/posts/:id/like',async(req,res) => {
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

app.post('/register', async (req,res) =>{
  const {username,password} = req.body;

  if (!username || !password){
    return res.status(400).json({error : 'Fill out all the fields'});
  }

  const existingUser = await db.get(`SELECT * FROM users WHERE username = ?`,[username]);
  if(existingUser){
    return res.status(400).json({error: 'user already exists'});
  }

  const hashedPassword = await bcrypt.hash(password,10);

  await db.run(`INSERT INTO users (username,password) VALUES (?,?)`,[username,hashedPassword])

  res.json({message: 'user created!'});
})

app.post('/login', async (req,res) => {
  const {username,password} = req.body;

  if(!username || !password){
    return res.status(400).json({error: 'Fill out all the fields'});
  }


  //looking for user in db
  const user = await db.get(`SELECT * FROM users WHERE username = ?`,[username]);
  if (!user){
    return res.status(400).json({message: 'User not found'});
  }

  const isMatch = await bcrypt.compare(password,user.password);
  if(!match){
    return res.status(400).json({message : 'Invalid password'})
  }
})

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
