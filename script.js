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
function playSound(frequency = 440.0, holdTime = 1000.0, type = 'sine', detune = 0.0, gain = 1.0) {
    //console.log("Playing sound, freq: ", frequency, " holdTime: ", holdTime)
    // Create an OscillatorNode
    const oscillator = createOscillator(frequency, holdTime, type, detune)
    
    connectNodeToMain(oscillator, gain)
    // Connect the oscillator to the destination (speakers)
    //oscillator.connect(audioContext.destination);

    // Start the oscillator
    oscillator.start();

    addOscillatorToQueue(oscillator, frequency, holdTime)
}


function createOscillator(frequency = 440.0, holdTime = 1000.0, type = 'sine', detune = 0.0)
{
    const oscillator = audioContext.createOscillator();
    oscillator.type = type; // Type of wave: sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz
    oscillator.detune.value = detune
    return oscillator
}



function addOscillatorToQueue(oscillator, frequency, holdTime)
{
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


function playCustomSound(frequency = 440.0, holdTime = 1000.0, type = 'sine', width = 10.0) {

    const a = createOscillator(frequency, holdTime, type, 0)
    const b = createOscillator(frequency, holdTime, type, width)
    const c = createOscillator(frequency, holdTime, type, -width)

    const gain = audioContext.createGain()
    const maxGain = 0.33
    gain.gain.value = maxGain
    a.connect(gain)
    b.connect(gain)
    c.connect(gain)


    const currentTime = audioContext.currentTime
    const attackDuration = document.getElementById("attackRange").value / 100
    const attackEndTime = currentTime + attackDuration
    const decayDuration = document.getElementById("decayRange").value / 100
    const releaseDuration = document.getElementById("releaseRange").value / 100

    console.log(releaseDuration)

    const totalDuration = attackDuration + decayDuration

    gain.gain.setValueAtTime(0, currentTime)
    gain.gain.linearRampToValueAtTime(maxGain, attackEndTime)
    gain.gain.setTargetAtTime(maxGain * document.getElementById("sustainRange").value / 100, attackEndTime, decayDuration)
    gain.gain.setTargetAtTime(maxGain * document.getElementById("sustainRange").value / 100, attackEndTime, decayDuration)
    
    setTimeout(() => {
        const releaseEndTime = audioContext.currentTime + releaseDuration
        gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime)
        gain.gain.linearRampToValueAtTime(0, releaseEndTime)
    }, holdTime);

    connectNodeToMain(gain) 

    a.start()
    b.start()
    c.start()

    addOscillatorToQueue(a, frequency, holdTime + releaseDuration * 1000)
    addOscillatorToQueue(b, frequency, holdTime + releaseDuration * 1000)
    addOscillatorToQueue(c, frequency, holdTime + releaseDuration * 1000)

}


function connectNodeToMain(node, gain = 1.0)
{
    const localGain = audioContext.createGain()
    localGain.gain.value = gain

    node.connect(localGain)

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Connect the oscillator to the analyser and then to the destination
    const delay = audioContext.createDelay()
    delay.delayTime.value = gateScale * tempo / 1000 ;

    const feedback = audioContext.createGain();
    feedback.gain.value = document.getElementById("feedbackRange").value / 100;
    //filter.type = 'lowpass'
    //filter.frequency.setTargetAtTime(2000, audioContext.currentTime, 0)
    const filter = audioContext.createBiquadFilter()
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(10000000, audioContext.currentTime);
    localGain.connect(filter)

    
    filter.connect(gainNode); // Connect oscillator to the GainNode (volume slider)
    filter.connect(delay); // Connect oscillator to the GainNode (volume slider)
    delay.connect(feedback)
    feedback.connect(delay)
    feedback.connect(gainNode)
    gainNode.connect(analyser);
    // Connect the oscillator to the destination (speakers)
    //oscillator.connect(audioContext.destination);

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
    //console.log("Updating queue..."); // Debugging line to check if the function is being called.
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
            document.getElementById('holdTime').value,
            currentWaveType
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
        playMode = document.getElementById('arpeggiatorPlaymode').value
        updatePlayModeFreqs()
    })

    document.getElementById("unisonWidthRange").addEventListener('input', function()
    {
        unisonWidth = document.getElementById('unisonWidthRange').value
    })

    document.getElementById('waveFormType').addEventListener('click', function()
    {
        currentWaveType = document.getElementById('waveFormType').value
    })
    document.getElementById('tempoRange').addEventListener('input', function()
    {
        tempo = 400 - document.getElementById('tempoRange').value + 75
    })
    document.getElementById('gateRange').addEventListener('input', function()
    {
        gateScale = document.getElementById('gateRange').value / 100.0
    })
    document.getElementById('octaveRange').addEventListener('input', function()
    {
        var value = Math.max(document.getElementById('octaveRange').value, 1)
        document.getElementById('octaveRange').value = value
        octaveTarget = value
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

let currentWaveType = "sine"
let unisonWidth = 0
let playModeIndex = 0
const playModes = ["up", "down", "updown"]
let inputFreqs = []
let freqs = inputFreqs
let arpeggiatorTimeout
let noteIndex = 0
let tempo = 275
let playMode = "up"
let prevNoteIndex = 0
let octaveTarget = 1
let currentOctave = 0
let gateScale = 0.5

function startArpeggiator()
{
    arpeggiatorTimeout = setTimeout(playNextNote, tempo)
}

function stopArpeggiator() 
{
    if (arpeggiatorTimeout != null)
    {
        clearInterval(arpeggiatorTimeout)
        arpeggiatorTimeout = null
    }
}


function playNextNote()
{
    let index = noteIndex % freqs.length
    if (index >= freqs.length - 1)
    {
        currentOctave += 1
        currentOctave = currentOctave % octaveTarget
    }
    //currentOctave = Math.floor(noteIndex / freqs.length) % octaveTarget
    //currentOctave = 0
    //console.log(index, " : ", freqs[index])
    if (inputFreqs.length > 0)
    {
        if (playMode == 'random')
        {
            index = Math.floor(Math.random() * (freqs.length))
        }
        if (unisonWidth == 0)
        {
            playSound(freqs[index] * Math.pow(2, currentOctave), tempo * gateScale, currentWaveType)
        }
        else
        {
            playCustomSound(freqs[index] * Math.pow(2, currentOctave), tempo * gateScale, currentWaveType, unisonWidth)
        }
    }
    
    prevNoteIndex = index
    noteIndex += 1
    arpeggiatorTimeout = setTimeout(playNextNote, tempo)
}

//const synthKeys = document.querySelectorAll(".key"); // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth
const keyCodes = [
    "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight",
  "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter",
  "Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight",
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace",
  "Escape",
];


const noteFreqs = [
    16.352 ,	
    17.324,
    18.354,
    19.445,
    20.602,
    21.827,
    23.125,
    24.500,
    25.957, 
    27.500,
    29.135,
    30.868
]

const noteNames = [
    'C', 	
    'C#', 
    'D', 
    'D#', 
    'E', 
    'F', 
    'F#', 
    'G' ,
    'G#' ,
    'A',
    'A#', 	
    'B',
]


function keyNote(event) {
    let keyIndex = keyCodes.indexOf(event.code)
    let noteIndex = keyIndex % 12
    let octave = Math.floor(keyIndex / 12.0) + 1
    let freq = noteFreqs[noteIndex] * Math.pow(2, octave)
    console.log(noteNames[noteIndex] + octave)
    if (!isNaN(freq)) {
        if (event.type === "keydown") {
            if (inputFreqs.indexOf(freq) == -1)
            {
                inputFreqs.push(freq)
            }
        } else {
            inputFreqs = inputFreqs.filter(function(currentFreq) {
                return currentFreq != freq;
            });
        }
        //inputFreqs = inputFreqs.sort(function(a,b) { return a - b;});
        updatePlayModeFreqs()
        var text = "Keys: "
        inputFreqs.forEach(element => {
            for (let i = 1; i < 10; i++)
            {
                let index = noteFreqs.indexOf(element / Math.pow(2, i))
                if (index != -1)
                {
                    text += noteNames[index] + i + " "
                    break
                }
            }
        }); 
        document.getElementById("keysPlaying").textContent = text
        //event.preventDefault();
    }
}

addEventListener("keydown", keyNote);
addEventListener("keyup", keyNote);


function notePressed(event) 
{
    if (event.buttons & 1) {
        const dataset = event.target.dataset;

        if (!dataset["pressed"] && dataset["octave"]) {
        const octave = Number(dataset["octave"]);
        oscList[octave][dataset["note"]] = playTone(dataset["frequency"]);
        dataset["pressed"] = "yes";
        }
    }
}

function noteReleased(event) 
{
    const dataset = event.target.dataset;

    if (dataset && dataset["pressed"]) {
        const octave = Number(dataset["octave"]);

        if (oscList[octave] && oscList[octave][dataset["note"]]) {
        oscList[octave][dataset["note"]].stop();
        delete oscList[octave][dataset["note"]];
        delete dataset["pressed"];
        }
    }
}


function updatePlayModeFreqs()
{
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
    }
    else
    {
        freqs = inputFreqs
    }
    
}