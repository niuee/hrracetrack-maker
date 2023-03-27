import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import React, { ReactHTMLElement, useEffect, useRef } from 'react';
import {Grid, Typography, Tooltip, TextField} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { divide } from 'lodash';


export default function TJS():JSX.Element {

    useEffect(setup, [])

    function setup(){




        
        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        camera.position.y = 10

        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(renderer.domElement)

        let control = new OrbitControls(camera, renderer.domElement)
        control.minPolarAngle= 0; // radians
        control.maxPolarAngle = Math.PI; // radians

        const geometry = new THREE.BoxGeometry()
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        })

        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)
        const size = 10;
        const divisions = 10;

        const gridHelper = new THREE.GridHelper( size, divisions );
        scene.add( gridHelper );

        window.addEventListener('resize', onWindowResize, false)
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
            render()
        }

        function animate() {
            requestAnimationFrame(animate)

            // cube.rotation.x += 0.01
            // cube.rotation.y += 0.01

            render()
        }

        function render() {
            renderer.render(scene, camera)
        }

        animate()

    };

    return (
        <div>
            Hello World!
        </div>
    )
}