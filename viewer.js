class GeologicalViewer {
    constructor() {
        this.data = null;
        this.init2DViewer();
        this.init3DViewer();
        this.loadData();
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            this.data = await response.json();
            this.populateSectionDropdown();
            this.updateViewers();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    populateSectionDropdown() {
        const select = document.getElementById('sectionSelect');
        this.data.polygonsBySection.forEach(section => {
            const option = document.createElement('option');
            option.value = section.sectionName;
            option.textContent = section.sectionName;
            select.appendChild(option);
        });

        select.addEventListener('change', () => this.update2DViewer());
    }

    init2DViewer() {
        const margin = {top: 20, right: 20, bottom: 30, left: 40};
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        this.svg = d3.select('#viewer2D')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                this.svg.attr('transform', event.transform);
                this.updateAxes();
            });

        d3.select('#viewer2D svg').call(this.zoom);
    }

    init3DViewer() {
        const width = 800;
        const height = 400;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        document.getElementById('viewer3D').appendChild(this.renderer.domElement);

        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Add grid
        const gridHelper = new THREE.GridHelper(1000, 20);
        this.scene.add(gridHelper);

        // Set initial camera position
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);

        this.animate();
    }

    update2DViewer() {
        const selectedSection = document.getElementById('sectionSelect').value;
        const sectionData = this.data.polygonsBySection.find(
            section => section.sectionName === selectedSection
        );

        if (!sectionData) return;

        // Clear previous drawings
        this.svg.selectAll('path').remove();

        // Create path generator
        const pathGenerator = d3.line()
            .x(d => d.vertex[0])
            .y(d => d.vertex[1]);

        // Draw polygons
        sectionData.polygons.forEach(polygon => {
            this.svg.append('path')
                .datum(polygon.points2D)
                .attr('fill', `#${polygon.color}`)
                .attr('stroke', 'black')
                .attr('d', pathGenerator);
        });
    }

    update3DViewer() {
        // Clear previous meshes
        this.scene.children = this.scene.children.filter(child => child.isGridHelper);

        this.data.polygonsBySection.forEach(section => {
            section.polygons.forEach(polygon => {
                const shape = new THREE.Shape();
                const points = polygon.points3D.map(p => new THREE.Vector3(...p.vertex));
                
                shape.moveTo(points[0].x, points[0].y);
                points.forEach(point => shape.lineTo(point.x, point.y));
                
                const geometry = new THREE.ShapeGeometry(shape);
                const material = new THREE.MeshBasicMaterial({
                    color: `#${polygon.color}`,
                    side: THREE.DoubleSide
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
            });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateViewers() {
        this.update2DViewer();
        this.update3DViewer();
    }
}

// Initialize the viewer when the page loads
window.addEventListener('load', () => {
    new GeologicalViewer();
});