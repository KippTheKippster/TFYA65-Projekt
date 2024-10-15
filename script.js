// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// List to keep track of active oscillators
let activeOscillators = [];
let addUndertoneCounter = 0;
let addOvertoneCounter = 0;
let positionInArray = null;

// Create a GainNode (volume slider)
const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

const analyser = audioContext.createAnalyser();
analyser.fftSize = 1024;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);



// Function to play a sound
function playSound(frequency = 440.0, holdTime = 1000.0) {
    console.log("Playing sound, freq: ", frequency, " holdTime: ", holdTime)
    // Create an OscillatorNode
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Type of wave: sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Connect the oscillator to the analyser and then to the destination
    oscillator.connect(analyser);
    analyser.connect(audioContext.destination);
    oscillator.connect(gainNode); // Connect oscillator to the GainNode (volume slider)
    // Connect the oscillator to the destination (speakers)
    //oscillator.connect(audioContext.destination);

    // Start the oscillator
    oscillator.start();

    // Add the oscillator to the list of active oscillators with its start time and hold time
    const startTime = audioContext.currentTime;
    activeOscillators.push({ oscillator, frequency, startTime, holdTime });

    // Stop the oscillator after the specified hold time
    setTimeout(() => {
        oscillator.stop();
        // Remove the oscillator from the list of active oscillators
        activeOscillators = activeOscillators.filter(osc => osc.oscillator !== oscillator);
        updateOscillatorQueue();
    }, holdTime);

    // Update the oscillator queue display
    updateOscillatorQueue();
    drawWaveform();
}

// Function to set volume
function setVolume(volume) {
    // Ensure the volume is within the range of 1 to 100
    if (volume < 1 || volume > 100) {
        console.error('Volume must be between 1 and 100');
        return;
    }

    // Convert the volume from 1-100 to 0-1
    gainNode.gain.value = volume / 100;
}

function addVibrato(positionInArray) {

    // Retrieve the oscillator and the necessary data from the array
    const oscillator = activeOscillators[positionInArray].oscillator;

    // Check if oscillator exists
    if (!oscillator) {
        console.log("No oscillator found at position", positionInArray);
        return;
    }

    // Stop any existing vibratoOscillator
    if (activeOscillators[positionInArray].vibratoOscillator) {
        activeOscillators[positionInArray].vibratoOscillator.stop();
        console.log("Stopped previous vibrato on oscillator at position", positionInArray);
    }

    // Retrieve vibrato frequency and depth values from input elements
    const vibratoFrequency = parseFloat(document.getElementById('vibratoFrequency').value);
    const vibratoDepth = parseFloat(document.getElementById('vibratoGain').value);
    console.log("Vibrato frequency:", vibratoFrequency, "vibrato depth:", vibratoDepth);

    // Create an LFO (low-frequency oscillator) for vibrato
    const vibratoOscillator = audioContext.createOscillator();
    vibratoOscillator.frequency.value = vibratoFrequency;

    // Create a gain node to control the vibrato depth
    const vibratoGain = audioContext.createGain();
    vibratoGain.gain.value = vibratoDepth;

    // Connect the LFO to the gain node
    vibratoOscillator.connect(vibratoGain);

    // Connect the gain node to the oscillator's frequency
    vibratoGain.connect(oscillator.frequency);

    // Start the vibrato oscillator
    vibratoOscillator.start();

    // Store the new LFO oscillator so you can stop or modify it later
    activeOscillators[positionInArray].vibratoOscillator = vibratoOscillator;

    console.log("Vibrato added to oscillator at position", positionInArray);
}


// Function to stop all active oscillators
function stopAllSounds() {
    activeOscillators.forEach(osc => osc.oscillator.stop());
    activeOscillators = [];
    console.log('All sounds stopped. Active oscillators: ' + activeOscillators.length);
    updateOscillatorQueue();
    addUndertoneCounter = 0;
    addOvertoneCounter = 0;
}

// Periodically update the oscillator queue display
setInterval(updateOscillatorQueue, 500);

function updateOscillatorQueue() {
    console.log("Updating queue..."); // Debugging line to check if the function is being called.
    const textArea = document.getElementById('oscillatorQueue');
    const currentTime = audioContext.currentTime;

    // Sort activeOscillators based on the remaining time
    activeOscillators.sort((a, b) => {
        const remainingTimeA = (a.startTime + a.holdTime / 1000) - currentTime;
        const remainingTimeB = (b.startTime + a.holdTime / 1000) - currentTime;
        return remainingTimeA - remainingTimeB;
    });

    // Map each oscillator to a string and display "playing with vibrato" if vibrato is active
    textArea.value = activeOscillators.map((osc, index) => {
        const remainingTime = ((osc.startTime + osc.holdTime / 1000) - currentTime).toFixed(2);
        const vibratoStatus = osc.vibratoOscillator ? " (playing with vibrato)" : "";
        return `${index + 1}: Frequency: ${osc.frequency} Hz, Remaining Time: ${remainingTime} s${vibratoStatus}`;
    }).join('\n');
}

// Function to close the popup
function closePopup() {
    document.getElementById('popup').style.display = 'none';
    document.getElementById('popup-overlay').style.display = 'none';
}

// Add event listener to the buttons
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('stopButton').addEventListener('click', function () {
        stopAllSounds();
    });
    document.getElementById('startButton').addEventListener('click', function () {
        playSound(
            document.getElementById('frequency').value,
            document.getElementById('holdTime').value
        )
    })
    document.getElementById('addHarmonic').addEventListener('click', function () {
        addOvertone();
    })
    document.getElementById('addUndertone').addEventListener('click', function () {
        addUndertone();
    })
    // Add event listener to the volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', function () {
        setVolume(this.value);
    })
    // Add event listener to the vibrato button and sliders
    document.getElementById('addVibrato').addEventListener('click', function () {
        const positionInArrayElement = document.getElementById('oscillatorIndex');
        let positionInArray = parseInt(positionInArrayElement.value); // Keep position as integer
        //Array stars in 0
        positionInArray = positionInArray - 1;

        // Check if the input position is a valid number and if it refers to a valid oscillator in the array
        if (isNaN(positionInArray) || positionInArray < 0 || positionInArray >= activeOscillators.length) {
            console.log("Invalid position in array or no oscillator found at this position.");
            return; // Exit if the position is invalid
        }

        // Apply vibrato to the selected oscillator
        addVibrato(positionInArray);
    });



    // Listener for vibrato frequency input
    document.getElementById('vibratoFrequency').addEventListener('input', function () {
        const positionInArrayElement = document.getElementById('oscillatorIndex');
        let positionInArray = parseInt(positionInArrayElement.value); // Ensure it's an integer
        //Array stars in 0
        positionInArray = positionInArray - 1;

        // Apply vibrato if position is valid
        if (!isNaN(positionInArray) && positionInArray >= 0 && positionInArray < activeOscillators.length) {
            console.log("Applying vibrato to oscillator at position:", positionInArray);
            addVibrato(positionInArray);
        } else {
            console.log("Invalid positionInArray when trying to apply vibrato.");
        }
    });

    // Listener for vibrato gain (depth) input
    document.getElementById('vibratoGain').addEventListener('input', function () {
        const positionInArrayElement = document.getElementById('oscillatorIndex');
        let positionInArray = parseInt(positionInArrayElement.value); // Ensure it's an integer

        //Array stars in 0
        positionInArray = positionInArray - 1;

        // Apply vibrato if position is valid
        if (!isNaN(positionInArray) && positionInArray >= 0 && positionInArray < activeOscillators.length) {
            console.log("Applying vibrato to oscillator at position:", positionInArray);
            addVibrato(positionInArray);
        } else {
            console.log("Invalid positionInArray when trying to apply vibrato.");
        }
    });

    document.getElementById('arpeggiatorPlaymode').addEventListener('click', function()
    {
        clearInterval(arpeggiatorInterval)
        playModeIndex += 1
        playModeIndex = playModeIndex % playModes.length
        playMode = playModes[playModeIndex]
        if (playMode == "up")
        {
            freqs = inputFreqs
        }
        else if (playMode == "down")
        {
            freqs = Array.from(inputFreqs).reverse()
        }
        else if (playMode == "updown")
        {
            freqs = inputFreqs.concat(Array.from(inputFreqs).reverse())
            console.log(freqs)
        }
        startArpeggiator()
    })
    document.getElementById('tempoRange').addEventListener('input', function()
    {
        tempo = document.getElementById('tempoRange').value
    })
    document.getElementById('gateRange').addEventListener('input', function()
    {
        //clearInterval(arpeggiatorInterval)
        gateScale = document.getElementById('gateRange').value / 100.0
        //startArpeggiator()
    })

    startArpeggiator()
});


function checkUniqueActiveOscillators() {
    // make a set (all elements of the set are unique)
    const uniqueFrequencies = new Set();
    const uniqueFrequencies_Time = new Set();

    // Loop through activeOscillators and add frequencies to the Set
    for (const oscillator of activeOscillators) {
        uniqueFrequencies.add(oscillator.frequency);
        uniqueFrequencies_Time.add(oscillator.holdTime - oscillator.startTime);
    }
    // Convert the Set to an array if needed
    const uniqueFrequenciesArray = Array.from(uniqueFrequencies);
    const uniqueFrequenciesArray_Time = Array.from(uniqueFrequencies_Time);
    console.log("unique frequencies: " + uniqueFrequenciesArray);
    return [uniqueFrequencies, uniqueFrequenciesArray, uniqueFrequenciesArray_Time];
}

function addUndertone() {
    if (activeOscillators.length === 0) {
        console.error("No active oscillators to add undertone to.");
        return;
    }

    const baseFrequency = activeOscillators[0].frequency;
    const remainingHoldTime = (activeOscillators[0].holdTime - (audioContext.currentTime - activeOscillators[0].startTime) * 1000);

    if (remainingHoldTime <= 0) {
        console.error("No remaining hold time for the active oscillator.");
        return;
    }

    const undertoneFrequency = baseFrequency / (addUndertoneCounter + 2);
    console.log(`Base Frequency: ${baseFrequency}, Counter: ${addUndertoneCounter}, Undertone Frequency: ${undertoneFrequency}, Remaining Hold Time: ${remainingHoldTime}`);

    playSound(undertoneFrequency, remainingHoldTime);
    console.log("Added undertone frequency:", undertoneFrequency);
    addUndertoneCounter += 1;
}

function addOvertone() {
    if (activeOscillators.length === 0) {
        console.error("No active oscillators to add overtone to.");
        return;
    }

    const baseFrequency = activeOscillators[0].frequency;
    const remainingHoldTime = (activeOscillators[0].holdTime - (audioContext.currentTime - activeOscillators[0].startTime) * 1000);

    if (remainingHoldTime <= 0) {
        console.error("No remaining hold time for the active oscillator.");
        return;
    }

    const overtoneFrequency = baseFrequency * (addOvertoneCounter + 2);
    playSound(overtoneFrequency, remainingHoldTime);
    console.log("Added overtone frequency:", overtoneFrequency);
    addOvertoneCounter += 1;
}

function drawWaveform() {
    const canvas = document.getElementById('oscilloscope');
    const canvasCtx = canvas.getContext('2d');

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.clientWidth, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0,0,0)';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i == 0) {
                canvasCtx.moveTo(x, y); // Corrected here
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

    }
    draw();
}

let playModeIndex = 0
const playModes = ["up", "down", "updown", "random"]
const inputFreqs = [174, 220, 330]
let freqs = inputFreqs
let arpeggiatorTimeout
let noteIndex = 0
let tempo = 150
let playMode = "up"
let prevNoteIndex = 0
let octaveTarget = 2
let currentOctave = 0
let gateScale = 0.5

function startArpeggiator()
{
    arpeggiatorTimeout = setTimeout(playNextNote, tempo)
}

function getArrayNoteIndex(mode)
{
    let arrayNoteIndex = 0

    if (mode == "up")
    {
        arrayNoteIndex = noteIndex % freqs.length
    }
    else if (mode == "down")
    {
        let i = noteIndex % freqs.length
        arrayNoteIndex = freqs.length - i - 1
    }
    else if (mode == "updown")
    {
        let i = Math.floor(noteIndex / freqs.length) % 2
        if (i == 0)
        {
            arrayNoteIndex = getArrayNoteIndex("up")
        }
        else
        {
            arrayNoteIndex = getArrayNoteIndex("down")
        }
    }
    else if (mode == "random")
    {
        arrayNoteIndex = Math.floor((Math.random() * freqs.length) - 0.001)
        if (freqs.length > 1)
        {
            if (prevNoteIndex == arrayNoteIndex)
            {
                arrayNoteIndex = getArrayNoteIndex("random")
            }
        }
    }
    else if (mode == "updownskip")
    {
        let i = Math.floor(noteIndex / freqs.length) % 2
        if (i == 0)
        {
            arrayNoteIndex = getArrayNoteIndex("up")
        }
        else
        {
            arrayNoteIndex = getArrayNoteIndex("down")
        }
    }
    

    return arrayNoteIndex
}

function playNextNote()
{
    //let index = getArrayNoteIndex(playMode)
    let index = noteIndex % freqs.length
    if (index >= freqs.length - 1)
    {
        currentOctave += 1
        currentOctave = currentOctave % octaveTarget
    }
    //currentOctave = Math.floor(noteIndex / freqs.length) % octaveTarget
    //currentOctave = 0
    //console.log(index, " : ", freqs[index])
    playSound(freqs[index] * Math.pow(2, currentOctave), tempo * gateScale, "square")
    prevNoteIndex = index
    noteIndex += 1
    arpeggiatorTimeout = setTimeout(playNextNote, tempo)
}