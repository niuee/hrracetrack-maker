# hrracetrack-maker

[Live Demo](https://vntchang.dev/racetrack-maker).

This is essentially a customized bezier curve editor that I wrote for my horse racing simulation game. The editing logic follows the one in Blender. This is a tool for me to create tracks based on realistic racecourses in the world that I can use in the physics simulation engine. Currently, the menus and buttons are all in Chinese.  

To Pan and Zoom 
- Mouse and Keyboard: Hold MetaKey (command/windows) and drag the mouse to pan. Scroll the wheel to zoom.
- Trackpad: Pinch to Zoom, two-finger slide to pan

There are two modes in the editor. (Use ⌥ Option (or Alt) to switch between modes)
- Object Mode: You can select curves using the list on the right side of the screen. Selected curves would be highlighted in green. You can move around the selected curves (the entire curve). You can double-click the card in the curves list to rename the curve to your liking.
- Edit Mode: You can drag the selected control point. You can either extend or prepend the curve. 

I realized that I probably have to write an entire user manual in order to fully explain how the editor work. Maybe even a tutorial. So The detail would not be in this readme. But I think some of the control logic is fairly intuitive, so maybe you can just give it a spin and you'll pick it up real fast. I doubt this tool is useful for anyone other than me though. 

Install the dependencies
```
  npm install 
```

To build
```
  npx webpack
```

Copy the .env.sample file to .env
```
  cp .env.sample .env
```

Edit the port you want the server to run on default is 3001
```
  PORT=3001
```

Open your browser and go to localhost:<PORT in .env>
