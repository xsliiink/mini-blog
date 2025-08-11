import React, { use } from "react";
import {useState} from 'react';
import './LoginPage.css';

export default function LoginPage() {
  const [ username,setusername] = useState('');
  const [ password,setpassword] = useState('');
  const [message,setMessage] = useState('');

    const handleSubmit = async (e) => {
        
        e.preventDefault()
        
        if(!username.trimEnd() || !password.trim()){
            setMessage('Enter Username and Password');
        }

        try{
            const res = await fetch('/login', {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({username,password})
            })

            const data = await res.json();
            
            if (res.ok){
                setMessage('Login Successful!')
                setusername('');
                setpassword('');
            }else{
                setMessage(data.error || 'Something went wrong');
            }



        }catch(err){
           setMessage('Network Error');
        }
    };


  return(
    <div>
        <h1>Login Page</h1>
        
        <form onSubmit={handleSubmit}>
            <h2>Registration</h2>
            <input 
            type="text" 
            placeholder="Username"
            value={username}
            onChange={(e) =>  setusername(e.target.value)}
            />

            <input
             type="password"
              placeholder="Password"
              value={password}
              onChange={ (e) => setpassword(e.target.value)}
            />
            <button type="submit">Login</button>
            {message && <p>{message}</p>}
        </form>
    </div>
  );
}