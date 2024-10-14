// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// List to keep track of active oscillators
let activeOscillators = [];
let addUndertoneCounter = 0;
let addOvertoneCounter = 0;

// Create a GainNode (volume slider)
const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

// Function to play a sound
function playSound(frequency = 440.0, holdTime = 1000.0) {
    console.log("Playing sound, freq: ", frequency, " holdTime: ", holdTime)
    // Create an OscillatorNode
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Type of wave: sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz
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

    activeOscillators.sort((a, b) => {
        const remainingTimeA = (a.startTime + a.holdTime / 1000) - currentTime;
        const remainingTimeB = (b.startTime + b.holdTime / 1000) - currentTime;
        return remainingTimeA - remainingTimeB;
    });

    textArea.value = activeOscillators.map((osc, index) => {
        const remainingTime = ((osc.startTime + osc.holdTime / 1000) - currentTime).toFixed(2);
        return `${index + 1}: Frequency: ${osc.frequency} Hz, Remaining Time: ${remainingTime} s`;
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
    //startArpeggiator()
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
        });
})

const freqs = [174.6, 220.0, 329.6]
let arpeggiatorInterval
let noteIndex = 0

function startArpeggiator() {
    arpeggiatorInterval = setInterval(playNextNote)
}

function playNextNote() {

}

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
