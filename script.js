const AudioContext = window.AudioContext

var sampleRate = 44100

var context = new AudioContext({ latencyHint: "interactive", sampleRate: sampleRate })
var activeSource = context.createBufferSource()
var gainNode = context.createGain()

document.addEventListener("DOMContentLoaded", () => {
    var button = document.getElementById("HUH")
    button.onclick = function()
    {
        var frequency = 200 + 200 * Math.random()
        var time = 1.0
        var sampleCount = Math.round(time * sampleRate)

        var buffer = math.zeros(sampleCount)

        for (var i = 0; i < sampleCount; i++) 
        {
            buffer[i] = math.round((Math.sin(frequency * Math.PI * 2 * (i / sampleRate)) + 1) / 2.0)
        }
        savedBuffer = buffer;
        playBufferMatrix(buffer, sampleRate, true)
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

    var stopButton = document.getElementById("stopButton");
    stopButton.onclick = function() {
        if (activeSource) {
            activeSource.stop();
            activeSource = null;
        }
    };
})


function matrixToFloat32Array(matrix) 
{
    let array = new Float32Array(math.size(matrix)._data[0])

    for (let i = 0; i < array.length; i++)
    {
        array[i] = matrix[i]
    }
    return array
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
    activeSource.connect(gainNode);
    gainNode.connect(context.destination)
    gainNode.gain.setValueAtTime(0.9, context.currentTime)
    console.log(gainNode.gain)
    activeSource.start();

    //gainNode.gain.exponentialRampToValueAtTime(0.000001, context.currentTime + buffer.length / sampleRate)
    
}
