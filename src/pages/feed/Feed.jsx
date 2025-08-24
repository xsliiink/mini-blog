import React from 'react';
import { useEffect, useState } from 'react';
import * as jwt_decode from 'jwt-decode';
import './Feed.css';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';


export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newComment,setNewComment] = useState({});
  const [openComments,setOpenComments] = useState({});
  const [commentsByPost,setCommentsByPost] = useState({});
  const [forumMessages,setForumMessages] = useState([]);
  const [newMessage,setNewMessage] = useState('');
  const {token} = useAuth();
  const navigate = useNavigate();

  useEffect(() =>{
    if(!token){
        navigate('/login');
    }

    fetch('/api/posts')
    .then(res => res.json())
    .then(data => setPosts(data))
    .catch(err => console.error('Error fetching posts',err));
  },[token]);

  useEffect(() =>{
    const fetchForum = async () =>{
      const res = await fetch('/api/forum');
      if(res.ok){
        const data = await res.json();
        setForumMessages(data);

      }
    };
    fetchForum();
  },[]);

  const fetchPosts = async () =>{
    const res = await fetch('/api/posts',{
        headers:{
            'Authorization' : `Bearer ${token}`
        }
    });

    const data = await res.json();
  };

  const likePost = async (postId) =>{
    if(!token) return alert ('You have to authorize');

    try{
      const res = await fetch(`/api/posts/${postId}/like2`,{
        method: 'PATCH',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization' : `Bearer ${token}`
        }
      });
      if(!res.ok) throw new Error('Error liking post');

      const {post_id,likes} = await res.json();

      setPosts(posts.map(p => p.id === postId ? {...p,likes} : p));
    }catch(err){
      console.error(err);
    }
  }

  const addComment = async (postId) =>{
    if(!token) return alert ('You have to authorize');

    const text = newComment[postId] || '';
    if(!text.trim()) return;

     console.log('Отправляем комментарий:', { postId, text });

    const res = await fetch(`/api/posts/${postId}/comment`,{
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization' : `Bearer ${token}`
      },
      body: JSON.stringify({text})
    });
    if (res.ok){
      const updatedPost = await res.json();
      setPosts(posts.map(p => (p.id === postId ? updatedPost : p)));
      setNewComment({...newComment,[postId]: ""});
    }else{
      console.error('Error adding comment')
    }
  };

  const toggleComments = (postId) => {
    setOpenComments(prev =>({
      ...prev,
      [postId] : !prev[postId]
    }));
    if(!commentsByPost[postId]){
      loadComments(postId);
    }
  }

  const loadComments = async (postId) => {
    const res = await fetch(`/api/posts/${postId}/comment`)
    const data = await res.json();
    setCommentsByPost(prev =>({...prev,[postId] : data}));
  }

  const addMessage = async() =>{
    
    if (!token) return alert('You have to authorize!');
    
    const text = newMessage;
    if (!text.trim()) return;
    
    const res = await fetch('/api/forum', {
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Authorization' : `Bearer ${token}`
      },
      body : JSON.stringify({text})
    });
    if(res.ok){
      const updatedForum = await res.json();
      setNewMessage('');
      setForum(prev => [...prev,updatedForum])
    }else{
      console.error('Error adding a message')
    }
    
  }



  return(
    <div className='main-wrapper'>
        <div className="header"></div>
        <div className="container">
          <div className="feed">
            <h1>Feed</h1>
             {posts.map(post => (
              <div key = {post.id}>
                <p>{post.text}</p>
                {post.filename && (
                  <img src={`/uploads/${post.filename}`} alt="post" />
                )}
                {/* Кнопка комментаривев */}
                <button
                  className='comment-toggle'
                  onClick={() => toggleComments(post.id)}
                >
                  <MessageCircle size ={20}/>Comments
                </button>
                
                {/* Кнопка с лайками */}

                <button
                  className='like-button'
                  onClick={() => likePost(post.id)}
                >
                  ❤️ {post.likes}
                </button>

                {/* Блок комментарииев.Показывается только,если открыт */}
                {openComments[post.id] && (
                  <div className="comments-section">
                    <div className="comments">
                      {commentsByPost[post.id] && commentsByPost[post.id].length > 0 ? (
                        commentsByPost[post.id].map((c,idx) => ( //c - это объект комментария,idx - его индекс 
                          <div key = {idx} className="comment">
                            <strong>{c.username}:</strong> {c.text}
                          </div>
                        ))
                      ) : (
                        <p className='no-comments'>No comments yet!</p>
                      )}
                    </div>


                      {/*Добавляем комментарии  */}
                    <div className="add-comment">
                      <input type="text" 
                        placeholder='Write a comment...'
                        value = {newComment[post.id] || ''}
                        onChange={ (e) => setNewComment({...newComment, [post.id] : e.target.value})
                      }
                      />
                      <button onClick={ () => addComment(post.id)}>Send</button>
                    </div>

                  </div>
                )}
              </div>
             ))}
          </div>
          <div className="sidebar">
            <h1>Forum</h1>
            <div className="forum">
              <div className="messages">
                {forumMessages.map((m) =>(
                  <div key={m.id} className = "message">
                    <strong>{m.username}:</strong>{m.text}
                  </div>
                ))}
              </div>

              <div className="add-message">
                <input 
                type="text"
                placeholder='Write a message...'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                />

                <button onClick={addMessage}></button>
              </div>
            </div>
          </div>
        </div>
        <div className="footer"></div>
    </div>
  );
}