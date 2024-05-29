import './App.css';
import Dashboard from './dashBoard';
import Login from './login';
import SignUp from './signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { auth } from './FireBaseConfig';
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from'react';
import AuthStateListener from './AuthStateListener';

function App() {
  

  return (
    <BrowserRouter>
    {/* <AuthStateListener /> */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
