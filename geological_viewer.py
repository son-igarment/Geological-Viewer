import json
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

class GeologicalViewer3D:
    def __init__(self):
        self.data = None
        self.load_data()
        
    def load_data(self):
        try:
            with open('data.json', 'r') as file:
                self.data = json.load(file)
        except Exception as e:
            print(f"Error loading data: {e}")
            
    def create_3d_model(self, section_name="Section A1"):
        # Find section data
        section_data = next(
            (section for section in self.data["polygonsBySection"] 
             if section["sectionName"] == section_name), 
            None
        )
        
        if not section_data:
            print(f"No data found for section: {section_name}")
            return
            
        # Create figure
        fig = plt.figure(figsize=(12, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        # Scale factor (similar to Three.js implementation)
        SCALE_FACTOR = 0.1
        
        # Plot each polygon
        for polygon in section_data["polygons"]:
            if not polygon.get("points3D") or len(polygon["points3D"]) < 3:
                continue
                
            # Extract and scale vertices
            vertices = np.array([
                [p["vertex"][0] * SCALE_FACTOR, 
                 p["vertex"][1] * SCALE_FACTOR, 
                 p["vertex"][2] * SCALE_FACTOR]
                for p in polygon["points3D"]
            ])
            
            # Create polygon
            poly = Poly3DCollection([vertices])
            
            # Set color and transparency
            color = f"#{polygon.get('color', 'ff0000')}"
            poly.set_facecolor(color)
            poly.set_edgecolor('black')
            poly.set_alpha(0.7)
            
            # Add to plot
            ax.add_collection3d(poly)
            
        # Auto-scale axes
        all_points = np.vstack([
            [[p["vertex"][0] * SCALE_FACTOR, 
              p["vertex"][1] * SCALE_FACTOR, 
              p["vertex"][2] * SCALE_FACTOR]
             for p in polygon["points3D"]]
            for polygon in section_data["polygons"]
            if polygon.get("points3D")
        ])
        
        # Set axis limits
        margin = 10
        ax.set_xlim(all_points[:,0].min() - margin, all_points[:,0].max() + margin)
        ax.set_ylim(all_points[:,1].min() - margin, all_points[:,1].max() + margin)
        ax.set_zlim(all_points[:,2].min() - margin, all_points[:,2].max() + margin)
        
        # Labels and title
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        plt.title(f"3D Geological Model - {section_name}")
        
        # Set viewing angle similar to Three.js default
        ax.view_init(elev=30, azim=45)
        
        plt.show()

# Create and display the model
viewer = GeologicalViewer3D()
viewer.create_3d_model() 