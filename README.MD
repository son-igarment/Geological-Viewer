# Geological Section Viewer

A web-based viewer for displaying geological section data in both 2D and 3D views using D3.js and Three.js.

## Features

### 2D Viewer
- Interactive section selection via dropdown menu
- Polygon visualization with proper coloring based on soil types
- Pan and zoom capabilities
- Dynamic axis updates during navigation
- Polygon selection functionality

### 3D Viewer
- Complete 3D visualization of all geological sections
- Interactive camera controls (rotate, pan, zoom)
- Ground grid for spatial reference
- Proper polygon extrusion based on z-coordinates

## Implementation Notes

- 2D coordinates are mapped using D3's scaling functions
- 3D polygons are created using Three.js Shape and ExtrudeGeometry
- Polygon colors are specified in the data as hex values
- The grid size adapts to the data bounds
- Camera controls allow full 3D navigation

## Limitations

- Currently supports single section view in 2D
- Grid size is fixed in 3D view
- Limited styling options for polygons
- No support for texture mapping

## Future Improvements

- Add support for multiple section views
- Implement dynamic grid sizing
- Add texture support for geological layers
- Enhance polygon selection interaction
- Add data export capabilities

## How to run Geological-Viewer

1. Open Geological-Viewer in Visual Studio Code
2. Install Live Server of Ritwick Dey in Extension
3. Open index.html rigtclick on Open with Live Server
