import React, { useEffect, useRef } from 'react';
import {Grid, Typography, Tooltip, TextField} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Bezier } from 'bezier-js';



export default function RaceTrackBuildPage():JSX.Element {
    
    const navigate = useNavigate();
    const setup = () => {
        
        let canvas:HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement
        let racecourse_img = document.getElementById("racecourse_overlay") as HTMLImageElement
        let img_loaded = false;
        racecourse_img.onload = function() {
            img_loaded = true;
        }
        let ctx:CanvasRenderingContext2D = canvas.getContext("2d");

        function draw_racecourse(canvas_width: number, canvas_height:number, context:CanvasRenderingContext2D, image:HTMLImageElement){
            if (img_loaded){
                context.globalAlpha = 0.4;
                let image_ratio = image.height / image.width;
                let draw_width = canvas_width * 0.8;
                let draw_height =  draw_width * image_ratio;
                context.drawImage(image, canvas_width / 2 - draw_width / 2, canvas_height / 2 - draw_height / 2, draw_width, draw_height);
                context.globalAlpha = 1;
            }
        }


        const curve2 = new Bezier(100,25 , 10,90 , 110,100 , 150,195);

        function drawlines(context: CanvasRenderingContext2D, curve: Bezier):void {
            const p = curve.points,
                p1 = p[0],
                p2 = p[1],
                p3 = p[2],
                p4 = p[3];

            // // draw the curve
            context.beginPath();
            context.moveTo(p1.x,p1.y);
            context.bezierCurveTo(p2.x,p2.y, p3.x,p3.y, p4.x,p4.y);
            context.stroke();
        }
        
          

        ctx.save();
        let cameraOffset = { x: 0, y: 0 }
        let cameraZoom = 1
        let MAX_ZOOM = 5
        let MIN_ZOOM = 0.1
        let SCROLL_SENSITIVITY = 0.0005

        function draw()
        {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at

            ctx.restore();
            // ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
            ctx.scale(cameraZoom, cameraZoom)
            ctx.translate(cameraOffset.x,  cameraOffset.y )
            
            // drawbackground(ctx, drawlines, curve);
            draw_racecourse(window.innerWidth, window.innerHeight, ctx, racecourse_img);
            drawlines(ctx, curve2);
            
            window.requestAnimationFrame( draw )
        }

        // Gets the relevant location from a mouse or single touch event
        function getEventLocation(e)
        {
            if (e.touches && e.touches.length == 1)
            {
                return { x:e.touches[0].clientX, y: e.touches[0].clientY }
            }
            else if (e.clientX && e.clientY)
            {
                return { x: e.clientX, y: e.clientY }        
            }
        }


        let isDragging = false
        let dragStart = { x: 0, y: 0 }

        function onPointerDown(e)
        {
            if (e.which == 2){
                isDragging = true
                dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
                dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
            }
                
        }

        function onPointerUp(e)
        {
            if (e.which == 2){
                isDragging = false
                initialPinchDistance = null
                lastZoom = cameraZoom
            } else if (e.which == 1){
                let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x;
                let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y;
                console.log(curve2);
                console.log(leftClickX, leftClickY);
                console.log(e.clientX, e.clientY);
                if (proximity(curve2.points[0], {x:leftClickX, y:leftClickY})) {
                    console.log("left click is close to start point");
                }
            }

        }

        function proximity(point, click){
            let distance = Math.sqrt(Math.pow(point.x - click.x, 2) + Math.pow(point.y - click.y, 2));
            return distance < 100;
        }

        function onPointerMove(e)
        {
            if (isDragging)
            {
                cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
                cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
            }
        }

        let initialPinchDistance = null
        let lastZoom = cameraZoom


        function adjustZoom(zoomAmount, zoomFactor)
        {
            if (!isDragging)
            {
                if (zoomAmount)
                {
                    cameraZoom += zoomAmount
                }
                else if (zoomFactor)
                {
                    console.log(zoomFactor)
                    cameraZoom = zoomFactor*lastZoom
                }
                
                cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
                cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
                
                console.log(zoomAmount)
            }
        }

        canvas.addEventListener('mousedown', onPointerDown)
        canvas.addEventListener('mouseup', onPointerUp)
        canvas.addEventListener('mousemove', onPointerMove)
        canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY, 0.1))
        draw()
    };
    useEffect(setup, []);

    return (
        <div style={{position: 'relative'}}>
            <canvas id="canvas" style={{position:'absolute', top: 0, left: 0, width: "100%", height:"100vh", margin: "none"}}></canvas>
            <img id="racecourse_overlay" style={{display: "none"}}src="./tyk_racecourse.jpg" alt="racecourse" />
            <Button style={{position:"absolute", margin: "100px"}} onClick={()=>{navigate("/")}} variant="contained">回到首頁</Button>
        </div>
    )
}
