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
            const res = await fetch('/api/register',{
                method : 'POST',
                headers: {'Content-Type' : 'application/json'},
                body : JSON.stringify({userName,password}),
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
        <div className="register-wrapper">
            <div className="register-card">
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text"
                        placeholder="Username"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="inputs"
                    />
                    <input 
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="inputs"
                    />
                    <button type="submit" className="button1">Register</button>
                    {message && <p className="login-message">{message}</p>}
                </form>
            </div>
        </div>
    )
}