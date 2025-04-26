// Debug logging
console.log('Script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Canvas setup
    const drawingCanvas = document.getElementById('drawingCanvas');
    const planimeterCanvas = document.getElementById('planimeterCanvas');

    if (!drawingCanvas || !planimeterCanvas) {
        console.error('Canvas elements not found!');
        return;
    }
    
    console.log('Canvas elements found');

    const drawingCtx = drawingCanvas.getContext('2d');
    const planimeterCtx = planimeterCanvas.getContext('2d');

    // Set canvas dimensions
    function resizeCanvas() {
        console.log('Resizing canvas');
        const container = document.querySelector('.canvas-container');
        if (!container) {
            console.error('Canvas container not found!');
            return;
        }
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        console.log('Container dimensions:', width, height);
        
        // Set canvas dimensions
        drawingCanvas.width = width;
        drawingCanvas.height = height;
        planimeterCanvas.width = width;
        planimeterCanvas.height = height;
        
        // Set canvas style dimensions
        drawingCanvas.style.width = width + 'px';
        drawingCanvas.style.height = height + 'px';
        planimeterCanvas.style.width = width + 'px';
        planimeterCanvas.style.height = height + 'px';
        
        // Clear canvases
        drawingCtx.clearRect(0, 0, width, height);
        planimeterCtx.clearRect(0, 0, width, height);
        
        // Draw a test pattern to confirm canvas is working
        drawingCtx.fillStyle = '#f0f0f0';
        drawingCtx.fillRect(0, 0, width, height);
        drawingCtx.strokeStyle = '#000';
        drawingCtx.strokeRect(0, 0, width, height);
        
        console.log('Canvas dimensions set:', drawingCanvas.width, drawingCanvas.height);
    }

    // Initial resize
    console.log('Performing initial resize');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Drawing state
    let isDrawing = false;
    let points = [];
    let planimeterActive = false;
    let planimeterPosition = { x: 0, y: 0 };
    let planimeterAngle = 0;
    let planimeterSpeed = 2;
    let planimeterInterval;

    // Drawing functions
    function getMousePos(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        console.log('Mouse position:', x, y);
        return { x, y };
    }

    function startDrawing(e) {
        console.log('Start drawing event');
        e.preventDefault(); // Prevent default behavior
        if (planimeterActive) return;
        isDrawing = true;
        const pos = getMousePos(drawingCanvas, e);
        points = [{ x: pos.x, y: pos.y }];
        drawPoint(pos.x, pos.y);
    }

    function draw(e) {
        if (!isDrawing || planimeterActive) return;
        e.preventDefault(); // Prevent default behavior
        const pos = getMousePos(drawingCanvas, e);
        points.push({ x: pos.x, y: pos.y });
        drawPoint(pos.x, pos.y);
    }

    function stopDrawing(e) {
        console.log('Stop drawing event');
        if (!isDrawing) return;
        isDrawing = false;
        if (points.length > 2) {
            drawShape();
            calculateArea();
        }
    }

    function drawPoint(x, y) {
        console.log('Drawing point at:', x, y);
        drawingCtx.beginPath();
        drawingCtx.arc(x, y, 2, 0, Math.PI * 2);
        drawingCtx.fillStyle = '#000';
        drawingCtx.fill();
    }

    function drawShape() {
        console.log('Drawing shape with points:', points);
        drawingCtx.beginPath();
        drawingCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            drawingCtx.lineTo(points[i].x, points[i].y);
        }
        drawingCtx.closePath();
        drawingCtx.strokeStyle = '#000';
        drawingCtx.stroke();
    }

    // Planimeter functions
    function startPlanimeter() {
        if (points.length < 3) return;
        planimeterActive = true;
        document.getElementById('startPlanimeterBtn').disabled = true;
        document.getElementById('stopPlanimeterBtn').disabled = false;
        
        planimeterPosition = { ...points[0] };
        planimeterAngle = 0;
        
        planimeterInterval = setInterval(updatePlanimeter, 50);
    }

    function stopPlanimeter() {
        planimeterActive = false;
        document.getElementById('startPlanimeterBtn').disabled = false;
        document.getElementById('stopPlanimeterBtn').disabled = true;
        clearInterval(planimeterInterval);
        planimeterCtx.clearRect(0, 0, planimeterCanvas.width, planimeterCanvas.height);
    }

    function updatePlanimeter() {
        planimeterCtx.clearRect(0, 0, planimeterCanvas.width, planimeterCanvas.height);
        
        // Draw planimeter arm
        planimeterCtx.beginPath();
        planimeterCtx.moveTo(planimeterPosition.x, planimeterPosition.y);
        const endX = planimeterPosition.x + Math.cos(planimeterAngle) * 50;
        const endY = planimeterPosition.y + Math.sin(planimeterAngle) * 50;
        planimeterCtx.lineTo(endX, endY);
        planimeterCtx.strokeStyle = '#ff0000';
        planimeterCtx.stroke();
        
        // Update position
        planimeterAngle += 0.1;
        planimeterPosition.x += Math.cos(planimeterAngle) * planimeterSpeed;
        planimeterPosition.y += Math.sin(planimeterAngle) * planimeterSpeed;
        
        // Check if we've completed the shape
        if (isPointNearStart()) {
            stopPlanimeter();
        }
    }

    function isPointNearStart() {
        const start = points[0];
        const distance = Math.sqrt(
            Math.pow(planimeterPosition.x - start.x, 2) +
            Math.pow(planimeterPosition.y - start.y, 2)
        );
        return distance < 10;
    }

    // Area calculation
    function calculateArea() {
        const pointArray = points.map(p => [p.x, p.y]);
        fetch('/calculate_area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: pointArray }),
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('areaValue').textContent = data.area.toFixed(2);
            updateGraph(data.area);
        });
    }

    function updateGraph(area) {
        const trace = {
            x: [Date.now()],
            y: [area],
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Area'
        };
        
        const layout = {
            title: 'Area Over Time',
            xaxis: { title: 'Time' },
            yaxis: { title: 'Area (square units)' }
        };
        
        Plotly.newPlot('graph', [trace], layout);
    }

    // Event listeners
    console.log('Setting up event listeners');
    
    // Add mouse event listeners
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    
    // Add touch event listeners
    drawingCanvas.addEventListener('touchstart', function(e) {
        console.log('Touch start');
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startDrawing(mouseEvent);
    });

    drawingCanvas.addEventListener('touchmove', function(e) {
        console.log('Touch move');
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        draw(mouseEvent);
    });

    drawingCanvas.addEventListener('touchend', function(e) {
        console.log('Touch end');
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        stopDrawing(mouseEvent);
    });

    // Add hover effect to show canvas is interactive
    drawingCanvas.addEventListener('mouseover', function() {
        drawingCanvas.style.cursor = 'crosshair';
    });

    drawingCanvas.addEventListener('mouseout', function() {
        drawingCanvas.style.cursor = 'default';
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        planimeterCtx.clearRect(0, 0, planimeterCanvas.width, planimeterCanvas.height);
        points = [];
        document.getElementById('areaValue').textContent = '0';
        Plotly.purge('graph');
    });

    document.getElementById('startPlanimeterBtn').addEventListener('click', startPlanimeter);
    document.getElementById('stopPlanimeterBtn').addEventListener('click', stopPlanimeter);
}); 