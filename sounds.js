class SoundEffects {
    constructor() {
        this.audioContext = null;
    }

    initializeAudio() {
        // Initialize audio context on user interaction to comply with browser policies
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async playTing() {
        this.initializeAudio();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // High-pitched ting sound
        oscillator.frequency.setValueAtTime(1318.51, this.audioContext.currentTime); // E6 note
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    async playBreakEndAlarm() {
        this.initializeAudio();
        
        // Create oscillators for a bell-like sound
        const fundamental = this.audioContext.createOscillator();
        const harmonic1 = this.audioContext.createOscillator();
        const harmonic2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        fundamental.connect(gainNode);
        harmonic1.connect(gainNode);
        harmonic2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Bell-like frequencies (based on temple bell harmonics)
        const baseFreq = 440; // A4 as base frequency
        fundamental.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime); // fundamental
        harmonic1.frequency.setValueAtTime(baseFreq * 2, this.audioContext.currentTime); // first harmonic
        harmonic2.frequency.setValueAtTime(baseFreq * 3, this.audioContext.currentTime); // second harmonic

        // Ring the bell three times
        const ringDuration = 0.5; // Duration of each ring
        const spacing = 0.3; // Space between rings
        const totalDuration = (ringDuration + spacing) * 3;

        // First ring
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + ringDuration);

        // Second ring
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + ringDuration + spacing);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + ringDuration + spacing + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + ringDuration * 2 + spacing);

        // Third ring
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + (ringDuration + spacing) * 2);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + (ringDuration + spacing) * 2 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + totalDuration);

        fundamental.start();
        harmonic1.start();
        harmonic2.start();
        fundamental.stop(this.audioContext.currentTime + totalDuration);
        harmonic1.stop(this.audioContext.currentTime + totalDuration);
        harmonic2.stop(this.audioContext.currentTime + totalDuration);
    }

    async playStopWork() {
        this.initializeAudio();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Low octave sound (C4 note)
        oscillator.frequency.setValueAtTime(261.63, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    async playStartBreak() {
        this.initializeAudio();
        
        // Create two oscillators for a chime effect
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Chime effect using two frequencies (G5 and E6)
        osc1.frequency.setValueAtTime(783.99, this.audioContext.currentTime); // G5
        osc2.frequency.setValueAtTime(1318.51, this.audioContext.currentTime); // E6

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.3);
        osc2.stop(this.audioContext.currentTime + 0.3);
    }

    async playStopBreak() {
        this.initializeAudio();
        
        // Create two oscillators for a lower chime effect
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Lower chime effect using two frequencies (G4 and E5)
        osc1.frequency.setValueAtTime(392.00, this.audioContext.currentTime); // G4
        osc2.frequency.setValueAtTime(659.25, this.audioContext.currentTime); // E5

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.3);
        osc2.stop(this.audioContext.currentTime + 0.3);
    }
}

// Create a global instance
window.soundEffects = new SoundEffects(); 