import {Routes,Route} from 'react-router-dom';
import AdminPage from './adminpage/AdminPage';
import Feed from './feed/Feed';
import RegisterPage from './registerpage/RegisterPage';
import LoginPage from './loginpage/LoginPage';

function App(){
    return (
        <Routes>
            <Route path='/' element={<Feed/>}/>
            <Route path='/admin' element={<AdminPage/>}/>
            <Route path='/register' element={<RegisterPage/>}/>
            <Route path='/login' element={<LoginPage/>}/>
        </Routes>
    )
}

export default App;