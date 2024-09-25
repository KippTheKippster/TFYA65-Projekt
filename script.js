const AudioContext = window.AudioContext

var sampleRate = 44100
var context = new AudioContext({ latencyHint: "interactive", sampleRate: sampleRate })
var activeSource = context.createBufferSource()
var gainNode = context.createGain()

var odd = 3;
var int_count = 2;

document.addEventListener("DOMContentLoaded", () => {
    var button = document.getElementById("HUH")
    button.onclick = function()
    {
        var frequency = 200 + 200 * Math.random();
        var time = 0.14;
        var buffer = makeBuffer(frequency, time, sampleRate);

        /*for (var i = 0; i <= 70; i++)
        {
            buffer[i] = 1
        }
    
    
        for (var i = 0; i <= 70; i++)
        {
            buffer[i + 70] = -1
        }*/
        savedBuffer = buffer;
        savedFrequency = frequency;
        playBufferMatrix(buffer, sampleRate, true);
        console.log("Current frequency:", frequency);
    }

    var useBufferButton = document.getElementById("useBuffer");
    useBufferButton.onclick = function() {
        if (savedBuffer) {
            console.log("Using saved buffer:", savedBuffer);
            //Play the saved buffer again.
            playBufferMatrix(savedBuffer, 44100, true);
        } else {
            console.log("No buffer saved yet.");
        }
    };

    var useBufferButton2 = document.getElementById("playHarmonics");
    //harmonics are achived by multiplying the frequency by an odd integer
    useBufferButton2.onclick = function() {
        var time = 0.14;
        if (savedBuffer) {
            var harmonicsBuffer = makeBuffer(savedFrequency*odd, time, sampleRate);
            playBufferMatrix(harmonicsBuffer, 44100, true);
            console.log("current:frequency", savedFrequency*odd);
            odd += 2;
        } else {
            console.log("No buffer saved yet.");
        }
    };

    var useBufferButton3 = document.getElementById("playUndertones");
    //undertones are achived by dividing the frequency by an integer
    useBufferButton3.onclick = function() {
        var time = 0.14;
        if (savedBuffer) {
            var undertonesBuffer = makeBuffer(savedFrequency/int_count, time, sampleRate);
            playBufferMatrix(undertonesBuffer, 44100, true);
            console.log("current:frequency", savedFrequency/int_count);
            int_count += 1;
        } else {
            console.log("No buffer saved yet.");
        }
    };

    var stopButton = document.getElementById("stopButton");
    stopButton.onclick = function() {
        if (activeSource) {
            activeSource.stop();
            activeSource = null;
        }
    };
})

function makeBuffer(frequency, time, sampleRate) {
    var sampleCount = Math.round(time * sampleRate);
    var buffer = math.zeros(140);
    for (var i = 0; i < sampleCount; i++) 
        {
            buffer[i] = math.round((Math.sin(frequency * Math.PI * 2 * (i / sampleRate)) + 1) / 2.0)
        }
    return buffer;
}

function estimateFrequency(buffer, sampleRate) {
    // Perform FFT
    const fft = new FFT(buffer.length);
    const fftResult = fft.forward(buffer);
    const magnitude = fftResult.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
    const peakIndex = magnitude.indexOf(Math.max(...magnitude));
    
    // Calculate the frequency
    const frequency = peakIndex * sampleRate / buffer.length;
    return frequency;
}

function matrixToFloat32Array(matrix) 
{
    let array = new Float32Array(math.size(matrix)._data[0])

    for (let i = 0; i < array.length; i++)
    {
        array[i] = matrix[i]
    }
    return array
}


function playOscillator(frequency, type = "square")
{
    var oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
  
    if (type === "custom") {
        oscillator.setPeriodicWave(customWaveform);
    } else {
        oscillator.type = type;
    }
  
    oscillator.frequency.value = frequency;
    oscillator.start();
  
    return oscillator;
}


function playBufferMatrix(bufferMatrix, sampleRate = 44100, loop = false)
{
    playBuffer(matrixToFloat32Array(bufferMatrix), sampleRate, loop);
}


function playBuffer(buffer, sampleRate = 44100, loop = false) {
    var audioBuffer = context.createBuffer(1, buffer.length, sampleRate)
    audioBuffer.copyToChannel(buffer, 0)
    
    //if activeSource
    //activeSource.stop()
    //else{
    gainNode = context.createGain()
    activeSource = context.createBufferSource();
    //}

    activeSource.buffer = audioBuffer; 
    activeSource.loop = loop
    //activeSource.connect(context.destination)
    gainNode.gain.setValueAtTime(0.9, context.currentTime)
    activeSource.connect(gainNode);
    gainNode.connect(context.destination)
    activeSource.start();

    //gainNode.gain.exponentialRampToValueAtTime(0.000001, context.currentTime + buffer.length / sampleRate)
    return activeSource
}
