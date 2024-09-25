self.addEventListener('message', function()
{
    var length = math.fft(math.zeros(4000))._data.length
    self.postMessage(length)
})