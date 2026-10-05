const video = document.getElementById('video');
const canvas = document.getElementById('canvas'); 
const ctx = canvas.getContext('2d');
const photoStrip = document.getElementById('photo-strip');
const countdownEl = document.getElementById('countdown');
const statusText = document.getElementById('status-text');
const flashEl = document.getElementById('flash');

// Botones y Selectores
const startBtn = document.getElementById('start-btn');
const actionButtons = document.getElementById('action-buttons');
const downloadBtn = document.getElementById('download-btn');
const retakeBtn = document.getElementById('retake-btn');

const timerSelect = document.getElementById('timer-select');
const gridSelect = document.getElementById('grid-select');
const filterSelect = document.getElementById('filter-select');

// 1. Encender la cámara tradicionalmente (Sin IA)
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        video.srcObject = stream;
        statusText.innerText = "¡Todo listo! Ajusta las opciones y comienza.";
    })
    .catch(err => {
        statusText.innerText = "Error: Por favor permite el acceso a la cámara.";
    });

// 2. Aplicar Filtro en Tiempo Real
filterSelect.addEventListener('change', () => {
    video.style.filter = filterSelect.value;
});

// 3. Efectos de Sonido
function playBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800;
    osc.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.15);
}

function playClickSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    osc.type = "square";
    osc.frequency.value = 150;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.1);
}

// 4. Iniciar Secuencia Principal
startBtn.addEventListener('click', async () => {
    const numPhotos = parseInt(gridSelect.value);
    const delay = parseInt(timerSelect.value);

    // Preparar UI
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    actionButtons.classList.add('hidden');
    photoStrip.innerHTML = '';
    
    // Asignar clase de Grid al contenedor
    photoStrip.className = `grid-layout-${numPhotos}`;

    for (let i = 0; i < numPhotos; i++) {
        await runCountdown(delay);
        takePhoto();
    }

    statusText.innerText = "¡Fotos completadas!";
    actionButtons.classList.remove('hidden'); 
    startBtn.disabled = false;
    startBtn.style.opacity = '1';
});

function runCountdown(seconds) {
    return new Promise(resolve => {
        let count = seconds;
        countdownEl.innerText = count;
        countdownEl.classList.remove('hidden');
        playBeep(); 

        let interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.innerText = count;
                playBeep(); 
            } else {
                clearInterval(interval);
                countdownEl.classList.add('hidden');
                resolve(); 
            }
        }, 1000);
    });
}

function takePhoto() {
    playClickSound();
    flashEl.classList.add('flash-active');
    setTimeout(() => flashEl.classList.remove('flash-active'), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Aplicar el mismo filtro de CSS al Canvas para exportarlo
    ctx.filter = filterSelect.value !== 'none' ? filterSelect.value : 'none';

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imgUrl = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = imgUrl;
    photoStrip.appendChild(img);
}

// 5. Motor de Descarga con Grid Inteligente
downloadBtn.addEventListener('click', () => {
    const images = photoStrip.querySelectorAll('img');
    if (images.length === 0) return;

    const numPhotos = images.length;
    let cols = 1;
    let rows = numPhotos;
    
    // Lógica Matemática del Grid
    if (numPhotos === 4) { cols = 2; rows = 2; }
    if (numPhotos === 6) { cols = 2; rows = 3; }

    const stripCanvas = document.createElement('canvas');
    const ctxStrip = stripCanvas.getContext('2d');
    
    const imgWidth = images[0].naturalWidth;
    const imgHeight = images[0].naturalHeight;
    
    const bordeExterior = 40; 
    const separacion = 25;    
    const espacioTexto = 100; 
    
    stripCanvas.width = (imgWidth * cols) + (separacion * (cols - 1)) + (bordeExterior * 2);
    stripCanvas.height = (imgHeight * rows) + (separacion * (rows - 1)) + (bordeExterior * 2) + espacioTexto; 
    
    ctxStrip.fillStyle = '#FFFFFF';
    ctxStrip.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
    
    images.forEach((img, index) => {
        // Calcular posición X y Y basado en columnas y filas
        const colActual = index % cols;
        const filaActual = Math.floor(index / cols);

        const x = bordeExterior + (colActual * (imgWidth + separacion));
        const y = bordeExterior + (filaActual * (imgHeight + separacion));

        ctxStrip.drawImage(img, x, y, imgWidth, imgHeight);
    });

    ctxStrip.fillStyle = '#2d3436';
    ctxStrip.font = 'bold 45px "Isometra", serif'; 
    ctxStrip.textAlign = 'center';
    ctxStrip.fillText('¡Feliz Cumpleaños, Moniii!', stripCanvas.width / 2, stripCanvas.height - 50);
    
    const link = document.createElement('a');
    link.download = 'PhotoBooth_Cumpleaños.png';
    link.href = stripCanvas.toDataURL('image/png');
    link.click();
});

retakeBtn.addEventListener('click', () => {
    photoStrip.innerHTML = ''; 
    actionButtons.classList.add('hidden'); 
    statusText.innerText = "¡Personaliza tu sesión y presiona comenzar!"; 
});