import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';


export default function AdminPage() {
  const [posts, setPosts] = useState([]); // Список постов
  const [text, setText] = useState('');// Текст формы
  const[file,setFile] = useState(null);
  const inputRef = useRef(null);// Ссылка на input (для фокуса)
  const fileInputRef = useRef(null);


  // Загрузка постов с сервера при монтировании
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())//получаем промис и преобразовываем его в json,чтобы создать массив данных
      .then(data => setPosts(data))
      .catch(console.error);
  }, []);

  // Добавляем новый пост (POST запрос)
  const addPost = useCallback(async () => {
    if (!text.trim()) return; // не отправляем пустой текст

    const formData = new FormData();
    formData.append('text',text);
    if(file) {
      formData.append('file',file);
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]); // добавляем в начало списка
      setText('');
      setFile(null);                         // очищаем поле ввода
      inputRef.current.focus();            // ставит курсор обратно в поле ввода,чтбы не приходилось лишний раз клацать мышкой
    } catch (err) {
      console.error(err);
    }
  }, [text]);

  // Лайкаем пост (PATCH запрос)
  const likePost = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: 'PATCH' });
      const updatedPost = await res.json();
      setPosts(prev => prev.map(p => p.id === id ? updatedPost : p));//если id текущего поста совпадает с id поста, то заменяем его новым постом
    } catch (err) {
      console.error(err);
    }
  }, [text,file]);

  const deletePost = useCallback(async (id) => {
  try {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');

    setPosts(prev => prev.filter(p => p.id !== id)); // убираем удаленный пост из списка
  } catch (err) {
    console.error(err);
  }
}, []);


  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Мини-блог</h1>
      <div>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Что нового?"
          style={{ width: '80%', padding: 8 }}
          onKeyDown={e => { if (e.key === 'Enter') addPost(); }}
        />
        <input type="file" onChange={e => setFile(e.target.files[0])}/>
        <button onClick={addPost} style={{ padding: '8px 12px', marginLeft: 8 }}>
          Добавить
        </button>
      </div>

      <ul style={{ marginTop: 20, listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li key={post.id} style={{ marginBottom: 16, borderBottom: '1px solid #ccc', paddingBottom: 8 }}>
            <p>{post.text}</p>
            {post.filename && (
              <img  className = 'post-image 'src={`/uploads/${post.filename}`} alt="post" />
            )}
            <small>Лайков: {post.likes}</small><br/>
            <button onClick={() => likePost(post.id)}>Лайк</button>
            <button onClick={() => deletePost(post.id)} style={{ marginLeft: 8, color: 'red' }}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
