import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Home} from "./pages/Home";
import RaceTrackBuilder from './pages/RaceTrackBuilder';

const Index = () => {
  return (
      <Router>
         <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/builder" element={<RaceTrackBuilder/>}/>
          </Routes> 
      </Router>
  ); 
};

const container = document.getElementById('app') as HTMLElement;
const root = createRoot(container);
root.render(<Index/>);