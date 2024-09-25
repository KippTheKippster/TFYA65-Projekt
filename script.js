const AudioContext = window.AudioContext

var activeSource = null
var gainNode = null

document.addEventListener("DOMContentLoaded", () => {
    var button = document.getElementById("HUH")
    button.onclick = function()
    {
        var frequency = 300 + 200 * Math.random();
        var sampleRate = 44100;
        var time = 1.0
        var sampleCount = Math.round(time * sampleRate)

        var buffer = math.zeros(sampleCount);

        for (var i = 0; i < sampleCount; i++) 
        {
            buffer[i] = Math.sin(frequency * Math.PI * 2 * (i / sampleRate))
        }

        //console.log(buffer)
        //console.log(math.fft(buffer))

        playBufferMatrix(buffer, sampleRate, true)
    }
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
    var context = new AudioContext({ latencyHint: "interactive", sampleRate: sampleRate })
        
    var audioBuffer = context.createBuffer(1, buffer.length, sampleRate)
    audioBuffer.copyToChannel(buffer, 0)
    audioBuffer.copyToChannel(buffer, 0)
    
    if (activeSource != null)
    {
        //activeSource.stop()
    }
    //else{
    gainNode = context.createGain()
    activeSource = context.createBufferSource();
    //}

    activeSource.buffer = audioBuffer; 
    activeSource.loop = loop
    activeSource.connect(gainNode);
    gainNode.connect(context.destination)
    activeSource.start();
}
