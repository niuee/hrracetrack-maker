import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import {Home} from "./pages/Home";
import RaceTrackBuildPage from './pages/RaceTrack';
import TJS from './pages/TJS';


import * as THREE from 'three';

// const scene = new THREE.Scene();

// const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );
const Index = () => {
  return (
      <Router>
         <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/build_track" element={<RaceTrackBuildPage/>}/>
              <Route path="/test_page" element={<TJS/>}/>
          </Routes> 
      </Router>
      /** 
      <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: '100vh' }}
      >
          <Grid item xs={3}>
          </Grid>   
          
          <Typography variant='h1' >AROW Console</Typography>
          <Button variant="contained">Text</Button>
      </Grid> 
      */
  ); 
};

const container = document.getElementById('app') as HTMLElement;
const root = createRoot(container);
root.render(<Index/>);