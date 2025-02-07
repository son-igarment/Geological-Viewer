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

        select.addEventListener('change', () => this.updateViewers());
    }

    init2DViewer() {
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Change yScale so numbers increase from top to bottom
        this.xScale = d3.scaleLinear().range([0, width]);
        this.yScale = d3.scaleLinear().range([0, height]); // Invert range so y increases downward

        this.svg = d3.select('#viewer2D')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create axes
        this.xAxis = d3.axisBottom(this.xScale);
        this.yAxis = d3.axisLeft(this.yScale);

        // Add axis groups
        this.xAxisGroup = this.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`);

        this.yAxisGroup = this.svg.append('g')
            .attr('class', 'y-axis');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                this.svg.select('.plot-group').attr('transform', event.transform);
                
                // Update axes
                const newX = event.transform.rescaleX(this.xScale);
                const newY = event.transform.rescaleY(this.yScale);
                this.xAxisGroup.call(this.xAxis.scale(newX));
                this.yAxisGroup.call(this.yAxis.scale(newY));
            });

        // Add a group for the plot content
        this.plotGroup = this.svg.append('g')
            .attr('class', 'plot-group');

        d3.select('#viewer2D svg').call(this.zoom);
    }

    init3DViewer() {
        const width = 800;
        const height = 400;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 1);
        document.getElementById('viewer3D').appendChild(this.renderer.domElement);

        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add grid
        const gridHelper = new THREE.GridHelper(1000, 20);
        this.scene.add(gridHelper);

        // Add lighting
        this.ambientLight = new THREE.AmbientLight(0x404040);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(1, 1, 1);
        this.scene.add(this.ambientLight);
        this.scene.add(this.directionalLight);

        // Set initial camera position
        this.resetCamera();

        // Create a group to hold 3D meshes
        this.meshGroup = new THREE.Group();
        this.scene.add(this.meshGroup);

        this.animate();
    }

    resetCamera() {
        // Set camera to a better default position
        this.camera.position.set(1000, 1000, 1000);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    update2DViewer() {
        const selectedSection = document.getElementById('sectionSelect').value;
        const sectionData = this.data.polygonsBySection.find(
            section => section.sectionName === selectedSection
        );

        if (!sectionData) return;

        // Calculate bounds
        const points = sectionData.polygons.flatMap(polygon => polygon.points2D);
        const xExtent = d3.extent(points, d => d.vertex[0]);
        const yExtent = d3.extent(points, d => d.vertex[1]);

        // Update scale domains
        this.xScale.domain(xExtent);
        this.yScale.domain(yExtent);

        // Clear previous drawings
        this.plotGroup.selectAll('path').remove();

        // Create path generator with updated scales
        const pathGenerator = d3.line()
            .x(d => this.xScale(d.vertex[0]))
            .y(d => this.yScale(d.vertex[1]));

        // Draw polygons
        sectionData.polygons.forEach(polygon => {
            this.plotGroup.append('path')
                .datum(polygon.points2D)
                .attr('fill', `#${polygon.color}`)
                .attr('stroke', 'black')
                .attr('d', pathGenerator);
        });

        // Update axes
        this.xAxisGroup.call(this.xAxis);
        this.yAxisGroup.call(this.yAxis);

        // Perform zoom fit
        const bounds = this.plotGroup.node().getBBox();
        const parent = this.svg.node().parentElement;
        const fullWidth = parent.clientWidth - this.margin.left - this.margin.right;
        const fullHeight = parent.clientHeight - this.margin.top - this.margin.bottom;
        
        const scale = Math.min(
            fullWidth / bounds.width,
            fullHeight / bounds.height
        ) * 0.9; // Use 90% of available space

        const transform = d3.zoomIdentity
            .translate(
                (fullWidth - bounds.width * scale) / 2 - bounds.x * scale,
                (fullHeight - bounds.height * scale) / 2 - bounds.y * scale
            )
            .scale(scale);

        // Apply transform with animation
        d3.select('#viewer2D svg')
            .transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }

    update3DViewer() {
        // Clear existing meshes
        while(this.meshGroup.children.length > 0){ 
            this.meshGroup.remove(this.meshGroup.children[0]); 
        }

        const selectedSection = document.getElementById('sectionSelect').value;
        const sectionData = this.data.polygonsBySection.find(
            section => section.sectionName === selectedSection
        );

        if (!sectionData || !sectionData.polygons) {
            console.warn('No section data found for:', selectedSection);
            return;
        }

        console.log('Processing section:', selectedSection);

        // Draw polygons
        sectionData.polygons.forEach((polygon, index) => {
            if (!polygon.points3D || polygon.points3D.length < 3) {
                console.warn('Invalid polygon data at index:', index);
                return;
            }

            try {
                const shape = new THREE.Shape();
                const points = polygon.points3D.map(p => {
                    if (!Array.isArray(p.vertex) || p.vertex.length !== 3) {
                        console.warn('Invalid vertex data:', p);
                        return null;
                    }
                    return new THREE.Vector3(...p.vertex);
                }).filter(p => p !== null);

                if (points.length < 3) {
                    console.warn('Not enough valid points for polygon:', index);
                    return;
                }

                // Create shape from the first point
                shape.moveTo(points[0].x, points[0].y);
                
                // Add remaining points
                for (let i = 1; i < points.length; i++) {
                    shape.lineTo(points[i].x, points[i].y);
                }
                
                // Close the shape
                shape.lineTo(points[0].x, points[0].y);

                // Calculate extrusion height
                const zValues = points.map(p => p.z);
                const minZ = Math.min(...zValues);
                const maxZ = Math.max(...zValues);
                const depth = Math.abs(maxZ - minZ) || 100; // Increased default depth

                const extrudeSettings = {
                    depth: depth,
                    bevelEnabled: false,
                    steps: 1
                };

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const material = new THREE.MeshPhongMaterial({
                    color: `#${polygon.color || 'ff0000'}`,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.z = minZ;

                this.meshGroup.add(mesh);
            } catch (error) {
                console.error('Error creating polygon:', index, error);
            }
        });

        // After adding all meshes, adjust camera to view the entire model
        if (this.meshGroup.children.length > 0) {
            const bbox = new THREE.Box3().setFromObject(this.meshGroup);
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());

            // Calculate camera distance based on model size
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;

            // Position camera to look at model center
            this.camera.position.set(
                center.x + cameraDistance,
                center.y + cameraDistance,
                center.z + cameraDistance
            );
            this.camera.lookAt(center);
            this.controls.target.copy(center);
            this.controls.update();
        }

        // Ensure scene is rendered
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateViewers() {
        // Reset camera before updating views
        this.resetCamera();
        
        // Update both viewers
        this.update2DViewer();
        this.update3DViewer();
    }
}

// Initialize the viewer when the page loads
window.addEventListener('load', () => {
    new GeologicalViewer();
});