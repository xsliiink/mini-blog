import React from 'react';
import {useState} from 'react';
import './RegisterPage.css';


export default function LoginPage(){
    const [userName,setUserName] = useState('');
    const [password,setPassword] = useState('');
    const[message,setMessage] = useState('');
    

    const handleSubmit = async(e) =>{
        e.preventDefault();
        setMessage('');

        if (!userName.trimEnd() || !password.trim()){
            setMessage('Please enter your username and password');
            return;
        }

        try{
            const res = await fetch('/register',{
                method : 'POST',
                headers: {'Content-Type' : 'application/json'},
                body : JSON.stringify({username,password}),
            });
        
            const data = await res.json();

            if(res.ok){
                setMessage('Registration Succesfull!');
                setUserName('');
                setPassword('');
            }else{
                setMessage(data.error || ' Something went wrong!');
            }
        }
        catch(err){
            setMessage('Network Error!');
        }
    };
    
    return(
        <div style ={{maxWidth: 400, margin: 'auto',padding: 20 }}>
            <h1>Registration page</h1>
            <form onSubmit={handleSubmit} className='form'>
                <h2>Registration</h2>
                
                {/* Username field */}
                <input 
                className='inputs'
                type="text"
                placeholder='username'
                value={userName} 
                onChange={(e) => setUsername(e.target.value)}
                />

                {/* Password field */}
                <input
                className='inputs'
                 type="password"
                 placeholder='password'
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 />
                 <button type='submit' className='button1'>Register</button>
                 {message && <p>{message}</p>}
            </form>
        </div>
    )
}