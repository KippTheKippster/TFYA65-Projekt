const AudioContext = window.AudioContext

var sampleRate = 44100

var context = new AudioContext({ latencyHint: "interactive", sampleRate: sampleRate })

var activeSource = context.createBufferSource()
var gainNode = context.createGain()

function test(message) {
    const data = message.data
    var length = math.fft(math.zeros(4000))._data.length
    // Response
    postMessage(data)
  }



document.addEventListener("DOMContentLoaded", () => {
    var button = document.getElementById("HUH")
    button.onclick = function()
    {
          // Dynamic creation of a worker
            const bytes = new TextEncoder().encode(`self.onmessage = ${test.toString()}`)
            const blob = new Blob([bytes], {type: 'application/javascript'})
            const url = URL.createObjectURL(blob)
            const worker = new Worker(url)


            // Set up a listener for messages from the worker
            worker.onmessage = (message) => {
                // This is where you receive your worker response
                console.log("HUIDSAHUDHSui")
            }

            // Error handling
            worker.onerror = console.error

            // This message will be passed to the worker
            worker.postMessage('hello')
        //var worker = new Worker('./workers/bufferQueue.js');
        
        //worker.addEventListener('message', function(e) {
        //    console.log(e.data);
        //})
        
        //worker.postMessage('Happy Birthday');

        /*
        var frequency = 200 + 200 * Math.random()
        var time = 0.3
        var sampleCount = Math.round(time * sampleRate)

        var n = sampleCount + 50000

        var buffer = math.zeros(n)

        for (var i = 0; i < sampleCount; i++) 
        {
            buffer._data[i] = math.round((Math.sin(frequency * Math.PI * 2 * (i / sampleRate)) + 1) / 2.0)
        }

        console.table(buffer._data)
   
        var echo = math.zeros(n)
        for (var i = 0; i < n; i += 10000)
        {
            echo._data[i] = 1.0
        }
        echo._data[n-1] = 1.0
    
        var f_buffer = math.fft(buffer)
        var f_echo = math.fft(echo)

        var f_final = math.zeros(n)
        for (var i = 0; i < f_final._data.length; i++)
        {
            f_final._data[i] = math.multiply(f_buffer._data[i], f_echo._data[i])
        }


        var final = math.re(math.ifft(f_final))
        console.table(final)
        playBufferMatrix(final, sampleRate, false)
        */

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


function playFile(path)
{
    var audio = new Audio('ljud-bonk-1.wav');
    audio.play()
    console.log(audio.buffered)
    /*
    window
        .fetch(path)
        .then((response) => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.blob();
        })
        */
    //var blob = Blob()
    //FileReader.readAsArrayBuffer()
    //context.decodeAudioData(arrayBuffer, function(buffer) {
    //    buf = buffer;
    //    play();
    //});
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
