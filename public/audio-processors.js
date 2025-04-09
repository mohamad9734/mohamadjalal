/**
 * Advanced Audio Processors for Voice Recognition and Authentication
 * 
 * This file contains specialized AudioWorklet processors that improve
 * voice recognition accuracy and performance through:
 * 
 * 1. Real-time noise reduction
 * 2. Voice activity detection
 * 3. Feature extraction for voice biometrics
 */

// Voice Activity Detection Processor
class VoiceActivityDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    // Configuration
    this.samplingFrequency = sampleRate;
    this.frameDuration = 0.03; // 30ms frames
    this.frameSize = Math.round(this.samplingFrequency * this.frameDuration);
    this.energyThreshold = 0.0005;
    this.speechThreshold = 0.6;
    
    // State
    this.frameBuffer = new Float32Array(this.frameSize);
    this.bufferIndex = 0;
    this.isSpeaking = false;
    this.speechCount = 0;
    this.silenceCount = 0;
    
    // Speech detection parameters
    this.speechHangover = 8; // Frames to keep detecting speech after energy drops
    this.silenceHangover = 5; // Frames of silence needed to mark end of speech
    
    // Frequency analysis
    this.fftSize = 512;
    this.hzPerBin = this.samplingFrequency / this.fftSize;
    
    // Background noise estimation
    this.noiseEstimate = new Float32Array(this.fftSize / 2);
    this.noiseUpdateRate = 0.1;
    this.noiseFloor = 0.001;
    this.noiseInitialized = false;
    
    // Communication with main thread
    this.port.onmessage = this.handleMessage.bind(this);
  }
  
  handleMessage(event) {
    const { data } = event;
    
    if (data.type === 'setThreshold') {
      this.energyThreshold = data.threshold;
    } else if (data.type === 'resetNoise') {
      this.noiseInitialized = false;
    }
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }
    
    const samples = input[0];
    
    // Process incoming audio samples
    for (let i = 0; i < samples.length; i++) {
      // Add sample to buffer
      this.frameBuffer[this.bufferIndex] = samples[i];
      this.bufferIndex++;
      
      // Process a full frame
      if (this.bufferIndex >= this.frameSize) {
        this.processFrame(this.frameBuffer);
        this.bufferIndex = 0;
      }
    }
    
    return true;
  }
  
  processFrame(frame) {
    // Calculate energy in frame
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
    }
    energy /= frame.length;
    
    // Apply FFT for frequency analysis
    const fftOutput = this.performFFT(frame);
    
    // Update noise estimate during silence
    if (!this.isSpeaking || !this.noiseInitialized) {
      this.updateNoiseEstimate(fftOutput);
    }
    
    // Calculate signal-to-noise ratio
    const snr = this.calculateSNR(fftOutput);
    
    // Voice activity detection based on energy and SNR
    const speechLikelihood = this.detectSpeech(energy, snr);
    
    // State management with hangover scheme
    if (speechLikelihood > this.speechThreshold) {
      this.speechCount++;
      this.silenceCount = 0;
      
      if (this.speechCount > 2 && !this.isSpeaking) {
        // Speech started
        this.isSpeaking = true;
        this.port.postMessage({ type: 'speechStart', energy, snr });
      }
    } else {
      this.silenceCount++;
      this.speechCount = 0;
      
      if (this.silenceCount > this.silenceHangover && this.isSpeaking) {
        // Speech ended
        this.isSpeaking = false;
        this.port.postMessage({ type: 'speechEnd', duration: this.silenceCount * this.frameDuration });
      }
    }
    
    // Send periodic status updates
    if (currentFrame % 10 === 0) {
      this.port.postMessage({
        type: 'vadStatus',
        energy,
        snr,
        isSpeaking: this.isSpeaking,
        speechLikelihood
      });
    }
  }
  
  performFFT(frame) {
    // Simple FFT implementation
    // In a real app, use a proper FFT library
    const fftOutput = new Float32Array(this.fftSize / 2);
    
    // Simplified FFT calculation (placeholder)
    for (let bin = 0; bin < this.fftSize / 2; bin++) {
      let binEnergy = 0;
      const frequency = bin * this.hzPerBin;
      
      // Sum energy in frequency band
      for (let i = 0; i < frame.length; i++) {
        // This is a simplification; real FFT would be more complex
        binEnergy += Math.abs(frame[i] * Math.sin(2 * Math.PI * frequency * i / this.samplingFrequency));
      }
      
      fftOutput[bin] = binEnergy / frame.length;
    }
    
    return fftOutput;
  }
  
  updateNoiseEstimate(fftOutput) {
    if (!this.noiseInitialized) {
      // First frame, initialize noise estimate
      for (let i = 0; i < fftOutput.length; i++) {
        this.noiseEstimate[i] = Math.max(fftOutput[i], this.noiseFloor);
      }
      this.noiseInitialized = true;
    } else {
      // Update noise estimate with exponential smoothing
      for (let i = 0; i < fftOutput.length; i++) {
        this.noiseEstimate[i] = (1 - this.noiseUpdateRate) * this.noiseEstimate[i] + 
                               this.noiseUpdateRate * Math.max(fftOutput[i], this.noiseFloor);
      }
    }
  }
  
  calculateSNR(fftOutput) {
    let signalEnergy = 0;
    let noiseEnergy = 0;
    
    for (let i = 0; i < fftOutput.length; i++) {
      signalEnergy += fftOutput[i] * fftOutput[i];
      noiseEnergy += this.noiseEstimate[i] * this.noiseEstimate[i];
    }
    
    if (noiseEnergy < 1e-10) noiseEnergy = 1e-10;
    
    return 10 * Math.log10(signalEnergy / noiseEnergy);
  }
  
  detectSpeech(energy, snr) {
    // Combine energy and SNR for more robust detection
    const energyScore = energy > this.energyThreshold ? 
                        Math.min(1.0, energy / (this.energyThreshold * 4)) : 0;
    
    const snrScore = snr > 5 ? Math.min(1.0, (snr - 5) / 15) : 0;
    
    // Weight SNR more heavily for better noise robustness
    return 0.3 * energyScore + 0.7 * snrScore;
  }
}

// Feature Extraction Processor for Voice Authentication
class VoiceFeatureExtractor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Configuration
    this.samplingFrequency = sampleRate;
    this.frameSize = 512;
    this.hopSize = 256;
    this.melBands = 40;
    this.mfccCount = 13;
    
    // Buffers
    this.inputBuffer = new Float32Array(this.frameSize);
    this.bufferIndex = 0;
    this.framesProcessed = 0;
    
    // Feature buffers
    this.mfccFeatures = [];
    this.pitchValues = [];
    this.energyValues = [];
    
    // Mel filterbank
    this.melFilterbank = this.createMelFilterbank();
    
    // Window function (Hamming)
    this.window = new Float32Array(this.frameSize);
    for (let i = 0; i < this.frameSize; i++) {
      this.window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (this.frameSize - 1));
    }
    
    // Communication
    this.port.onmessage = this.handleMessage.bind(this);
  }
  
  handleMessage(event) {
    const { data } = event;
    
    if (data.type === 'getFeatures') {
      // Send collected features
      this.port.postMessage({
        type: 'features',
        mfcc: this.mfccFeatures,
        pitch: this.pitchValues,
        energy: this.energyValues,
        frameCount: this.framesProcessed
      });
      
      // Reset feature buffers
      this.mfccFeatures = [];
      this.pitchValues = [];
      this.energyValues = [];
      this.framesProcessed = 0;
    }
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }
    
    const samples = input[0];
    
    // Process incoming audio samples
    for (let i = 0; i < samples.length; i++) {
      // Add sample to buffer
      this.inputBuffer[this.bufferIndex] = samples[i];
      this.bufferIndex++;
      
      // Process a full frame
      if (this.bufferIndex >= this.frameSize) {
        this.processAudioFrame(this.inputBuffer);
        
        // Apply hop: move samples to start of buffer
        for (let j = 0; j < this.frameSize - this.hopSize; j++) {
          this.inputBuffer[j] = this.inputBuffer[j + this.hopSize];
        }
        
        this.bufferIndex = this.frameSize - this.hopSize;
        this.framesProcessed++;
      }
    }
    
    return true;
  }
  
  processAudioFrame(frame) {
    // Apply window
    const windowedFrame = new Float32Array(this.frameSize);
    for (let i = 0; i < this.frameSize; i++) {
      windowedFrame[i] = frame[i] * this.window[i];
    }
    
    // Calculate energy
    let energy = 0;
    for (let i = 0; i < this.frameSize; i++) {
      energy += windowedFrame[i] * windowedFrame[i];
    }
    energy /= this.frameSize;
    this.energyValues.push(energy);
    
    // Calculate pitch (simplified autocorrelation method)
    const pitch = this.calculatePitch(windowedFrame);
    this.pitchValues.push(pitch);
    
    // Calculate MFCCs
    const mfccs = this.calculateMFCCs(windowedFrame);
    this.mfccFeatures.push(mfccs);
    
    // Send features every 10 frames
    if (this.framesProcessed % 10 === 0) {
      this.port.postMessage({
        type: 'frameFeatures',
        mfcc: mfccs,
        pitch,
        energy,
        frameIndex: this.framesProcessed
      });
    }
  }
  
  calculatePitch(frame) {
    // Simplified autocorrelation pitch detection
    // Minimum and maximum detectable frequencies
    const minFreq = 80;  // Hz
    const maxFreq = 400; // Hz
    
    const minLag = Math.floor(this.samplingFrequency / maxFreq);
    const maxLag = Math.floor(this.samplingFrequency / minFreq);
    
    let maxCorrelation = 0;
    let bestLag = 0;
    
    // Calculate autocorrelation for different lags
    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      for (let i = 0; i < this.frameSize - lag; i++) {
        correlation += frame[i] * frame[i + lag];
        norm1 += frame[i] * frame[i];
        norm2 += frame[i + lag] * frame[i + lag];
      }
      
      // Normalize
      correlation = correlation / Math.sqrt(norm1 * norm2 + 1e-10);
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    // Convert lag to frequency
    const pitch = bestLag > 0 ? this.samplingFrequency / bestLag : 0;
    
    // Check confidence
    const isPitched = maxCorrelation > 0.3;
    
    return {
      frequency: isPitched ? pitch : 0,
      confidence: maxCorrelation
    };
  }
  
  calculateMFCCs(frame) {
    // Calculate spectrum
    const spectrum = this.calculateSpectrum(frame);
    
    // Apply mel filterbank
    const melEnergies = new Float32Array(this.melBands);
    for (let m = 0; m < this.melBands; m++) {
      let sum = 0;
      for (let k = 0; k < spectrum.length; k++) {
        sum += spectrum[k] * this.melFilterbank[m][k];
      }
      melEnergies[m] = Math.log(Math.max(sum, 1e-10));
    }
    
    // Apply DCT to get MFCCs
    const mfccs = new Float32Array(this.mfccCount);
    for (let i = 0; i < this.mfccCount; i++) {
      let sum = 0;
      for (let j = 0; j < this.melBands; j++) {
        sum += melEnergies[j] * Math.cos(Math.PI * i * (j + 0.5) / this.melBands);
      }
      mfccs[i] = sum;
    }
    
    return Array.from(mfccs);
  }
  
  calculateSpectrum(frame) {
    // Apply FFT (simplified implementation)
    const fftOutput = new Float32Array(this.frameSize / 2);
    
    for (let bin = 0; bin < this.frameSize / 2; bin++) {
      let real = 0;
      let imag = 0;
      const frequency = bin * this.samplingFrequency / this.frameSize;
      
      for (let i = 0; i < this.frameSize; i++) {
        real += frame[i] * Math.cos(2 * Math.PI * frequency * i / this.samplingFrequency);
        imag -= frame[i] * Math.sin(2 * Math.PI * frequency * i / this.samplingFrequency);
      }
      
      fftOutput[bin] = (real * real + imag * imag) / this.frameSize;
    }
    
    return fftOutput;
  }
  
  createMelFilterbank() {
    // Convert frequency to mel scale
    const freqToMel = (freq) => 1127 * Math.log(1 + freq / 700);
    const melToFreq = (mel) => 700 * (Math.exp(mel / 1127) - 1);
    
    // Frequency range
    const minFreq = 300;
    const maxFreq = this.samplingFrequency / 2;
    
    // Convert to mel scale
    const minMel = freqToMel(minFreq);
    const maxMel = freqToMel(maxFreq);
    
    // Create mel points
    const melPoints = new Float32Array(this.melBands + 2);
    for (let i = 0; i < this.melBands + 2; i++) {
      melPoints[i] = minMel + i * (maxMel - minMel) / (this.melBands + 1);
    }
    
    // Convert back to frequency
    const freqPoints = new Float32Array(this.melBands + 2);
    for (let i = 0; i < this.melBands + 2; i++) {
      freqPoints[i] = melToFreq(melPoints[i]);
    }
    
    // Convert to FFT bin indices
    const binPoints = new Uint32Array(this.melBands + 2);
    for (let i = 0; i < this.melBands + 2; i++) {
      binPoints[i] = Math.floor(freqPoints[i] * this.frameSize / this.samplingFrequency);
    }
    
    // Create filterbank
    const filterbank = new Array(this.melBands);
    for (let m = 0; m < this.melBands; m++) {
      filterbank[m] = new Float32Array(this.frameSize / 2);
      
      for (let k = binPoints[m]; k < binPoints[m + 1]; k++) {
        filterbank[m][k] = (k - binPoints[m]) / (binPoints[m + 1] - binPoints[m]);
      }
      
      for (let k = binPoints[m + 1]; k < binPoints[m + 2]; k++) {
        filterbank[m][k] = (binPoints[m + 2] - k) / (binPoints[m + 2] - binPoints[m + 1]);
      }
    }
    
    return filterbank;
  }
}

// Noise Reduction Processor
class NoiseReductionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Configuration
    this.frameSize = 512;
    this.hopSize = 128;
    this.fftSize = 512;
    
    // Processing state
    this.inputBuffer = new Float32Array(this.frameSize);
    this.outputBuffer = new Float32Array(this.frameSize);
    this.bufferIndex = 0;
    this.outputIndex = 0;
    
    // Noise profile
    this.noiseProfile = new Float32Array(this.fftSize / 2);
    this.noiseEstimateCount = 0;
    this.noiseEstimateDuration = 1; // seconds
    this.noiseEstimateFrames = Math.floor(this.noiseEstimateDuration * sampleRate / this.hopSize);
    this.isCapturingNoise = true;
    
    // Spectral subtraction parameters
    this.subtractionFactor = 2.0;
    this.floorFactor = 0.01;
    
    // Window function (Hann)
    this.window = new Float32Array(this.frameSize);
    for (let i = 0; i < this.frameSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.frameSize - 1)));
    }
    
    // Communication
    this.port.onmessage = this.handleMessage.bind(this);
  }
  
  handleMessage(event) {
    const { data } = event;
    
    if (data.type === 'startNoiseCapture') {
      this.isCapturingNoise = true;
      this.noiseEstimateCount = 0;
      this.noiseProfile.fill(0);
    } else if (data.type === 'setSubtractionFactor') {
      this.subtractionFactor = data.value;
    }
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }
    
    const inputSamples = input[0];
    const outputSamples = output[0];
    
    // Fill output with delayed clean signal
    for (let i = 0; i < outputSamples.length; i++) {
      if (this.outputIndex < this.frameSize) {
        outputSamples[i] = this.outputBuffer[this.outputIndex++];
      } else {
        outputSamples[i] = 0;
      }
    }
    
    // Process incoming audio
    for (let i = 0; i < inputSamples.length; i++) {
      this.inputBuffer[this.bufferIndex++] = inputSamples[i];
      
      if (this.bufferIndex >= this.frameSize) {
        // Process frame
        this.processFrame();
        
        // Shift input buffer by hop size
        for (let j = 0; j < this.frameSize - this.hopSize; j++) {
          this.inputBuffer[j] = this.inputBuffer[j + this.hopSize];
        }
        
        this.bufferIndex = this.frameSize - this.hopSize;
        this.outputIndex = 0;
      }
    }
    
    return true;
  }
  
  processFrame() {
    // Apply window to input
    const windowedInput = new Float32Array(this.frameSize);
    for (let i = 0; i < this.frameSize; i++) {
      windowedInput[i] = this.inputBuffer[i] * this.window[i];
    }
    
    // Perform FFT
    const { magnitude, phase } = this.performFFT(windowedInput);
    
    if (this.isCapturingNoise) {
      // Update noise profile
      for (let i = 0; i < this.fftSize / 2; i++) {
        this.noiseProfile[i] += magnitude[i] / this.noiseEstimateFrames;
      }
      
      this.noiseEstimateCount++;
      
      if (this.noiseEstimateCount >= this.noiseEstimateFrames) {
        this.isCapturingNoise = false;
        this.port.postMessage({ type: 'noiseProfileComplete' });
      }
    } else {
      // Apply spectral subtraction
      for (let i = 0; i < this.fftSize / 2; i++) {
        // Subtract noise profile
        let cleanMagnitude = magnitude[i] - this.subtractionFactor * this.noiseProfile[i];
        
        // Apply spectral floor
        cleanMagnitude = Math.max(cleanMagnitude, this.floorFactor * magnitude[i]);
        
        // Update magnitude
        magnitude[i] = cleanMagnitude;
      }
    }
    
    // Perform inverse FFT
    const cleanSignal = this.performInverseFFT(magnitude, phase);
    
    // Apply window and add to output buffer with overlap-add
    for (let i = 0; i < this.frameSize; i++) {
      this.outputBuffer[i] = cleanSignal[i] * this.window[i];
    }
  }
  
  performFFT(frame) {
    // Real implementation would use a proper FFT algorithm
    // This is a simplified version for demonstration
    
    const magnitude = new Float32Array(this.fftSize / 2);
    const phase = new Float32Array(this.fftSize / 2);
    
    for (let k = 0; k < this.fftSize / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < this.frameSize; n++) {
        const angle = 2 * Math.PI * k * n / this.fftSize;
        real += frame[n] * Math.cos(angle);
        imag -= frame[n] * Math.sin(angle);
      }
      
      magnitude[k] = Math.sqrt(real * real + imag * imag);
      phase[k] = Math.atan2(imag, real);
    }
    
    return { magnitude, phase };
  }
  
  performInverseFFT(magnitude, phase) {
    // Simplified inverse FFT
    const output = new Float32Array(this.frameSize);
    
    for (let n = 0; n < this.frameSize; n++) {
      let sample = 0;
      
      for (let k = 0; k < this.fftSize / 2; k++) {
        const angle = 2 * Math.PI * k * n / this.fftSize;
        sample += magnitude[k] * Math.cos(angle + phase[k]);
      }
      
      // Normalize
      output[n] = sample / (this.fftSize / 2);
    }
    
    return output;
  }
}

// Register processors
try {
  registerProcessor('voice-activity-detector', VoiceActivityDetector);
  registerProcessor('voice-feature-extractor', VoiceFeatureExtractor);
  registerProcessor('noise-reduction-processor', NoiseReductionProcessor);
} catch (error) {
  console.error('Failed to register audio processors:', error);
}