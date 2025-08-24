import React, { use } from "react";
import {useState} from 'react';
import './LoginPage.css';
import {useNavigate} from 'react-router-dom';

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
                setMessage('Login Successful!')
                setUserName('');
                setPassword('');
                navigate('/')
            }else{
                setMessage(data.error || data.message ||'Something went wrong');
            }
        }catch(err){
           setMessage('Network Error');
        }
    };


  return(
    <div>
        <h1>Login Page</h1>
        
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
              onChange={ (e) => setPassword(e.target.value)}
            />
            <button type="submit" className="button1">Login</button>
            {message && <p>{message}</p>}
        </form>
    </div>
  );
}