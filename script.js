// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// List to keep track of active oscillators
let activeOscillators = [];

// Function to play a sound
function playSound() {
    // Get the frequency and hold time from the input fields
    const frequency = document.getElementById('frequency').value;
    const holdTime = document.getElementById('holdTime').value;

    // Create an OscillatorNode
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Type of wave: sine, square, sawtooth, triangle
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz

    // Connect the oscillator to the destination (speakers)
    oscillator.connect(audioContext.destination);

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


// Function to stop all active oscillators
function stopAllSounds() {
    activeOscillators.forEach(oscillator => oscillator.stop());
    activeOscillators = [];
    console.log('All sounds stopped. Active oscillators: ' + activeOscillators.length);
    updateOscillatorQueue();
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

// Add event listener to the stop button
document.getElementById('stopButton').addEventListener('click', stopAllSounds);