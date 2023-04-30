import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Home} from "./pages/Home";
import RaceTrackBuildPage from './pages/RaceTrack';
import RaceTrackBuildCircularArcPage from './pages/RaceTrack-cir-arc';
import TJS from './pages/TJS';

const Index = () => {
  return (
      <Router>
         <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/build_track" element={<RaceTrackBuildPage/>}/>
              <Route path="/test_page" element={<TJS/>}/>
              <Route path="/buildCirArcTrack" element={<RaceTrackBuildCircularArcPage/>}/>
          </Routes> 
      </Router>
  ); 
};

const container = document.getElementById('app') as HTMLElement;
const root = createRoot(container);
root.render(<Index/>);