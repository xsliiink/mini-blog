import React, { use } from "react";
import {useState} from 'react';
import './LoginPage.css';
import {useNavigate} from 'react-router-dom';
import { FaUser, FaLock } from "react-icons/fa"

export default function LoginPage() {
  const [ userName,setUserName] = useState('');
  const [ password,setPassword] = useState('');
  const [message,setMessage] = useState('');
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
        
        e.preventDefault()
        
        if(!userName.trimEnd() || !password.trim()){
            setMessage('Enter Username and Password');
            return;
        }

        try{
            const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({userName,password})
            })

            const data = await res.json();
            
            if (res.ok){
                localStorage.setItem('token',data.token)// сохраняем JWT         
                
                const payload = JSON.parse(atob(data.token.split('.')[1]));

                if(payload.role === 'admin'){
                  navigate('/admin');
                }else{
                  navigate('/');
                }

                setMessage('Login Successful!')
                setUserName('');
                setPassword('');
            }else{
                setMessage(data.error || data.message ||'Something went wrong');
            }
        }catch(err){
           setMessage('Network Error');
        }
    };


  return(
    <div className="login-page">
  <div className="login-card">
    <h1>Welcome Back!</h1>
    <form onSubmit={handleSubmit} className="form">
      <h2>Login</h2>
      <input 
        className="inputs"
        type="text" 
        placeholder="Username"
        value={userName}
        onChange={(e) =>  setUserName(e.target.value)}
      />
      <input
        className="inputs"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="button1">Login</button>
      {message && <p className="login-message">{message}</p>}
    </form>
    <a href="/register" className="register-link">Don’t have an account? Register</a>
  </div>
</div>

  );
}