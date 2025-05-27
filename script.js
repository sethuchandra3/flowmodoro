class FlowTimer {
    constructor() {
        // Initialize state variables
        this.workSeconds = 0;
        this.breakSeconds = 0;
        this.workInterval = null;
        this.breakInterval = null;
        this.isPaused = false;
        this.totalBreakSeconds = 0;
        this.negativeBreakTime = 0;
        this.isSoundEnabled = true;
        this.isBreakStopped = false;
        this.isBreakActive = false;
        this.hasWorkedSinceStart = false;
        this.pomodoroIcon = '🍅';
        this.pomodoroCount = 0;
        this.lastPomodoroCheck = 0;
        this.pipWindow = null;

        // Cache DOM elements
        this.cacheElements();

        // Initialize PiP support
        this.initializePiP();

        // Initialize workflow settings
        this.initializeWorkflowSettings();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize displays
        this.initializeDisplays();
    }

    cacheElements() {
        // Cache all DOM elements for better performance
        this.pipButton = document.getElementById('pipButton');
        this.pipError = document.getElementById('pipError');
        this.timerContainer = document.getElementById('timerPipContainer');
        this.workTimer = document.getElementById('workTimer');
        this.breakTimer = document.getElementById('breakTimer');
        this.workButton = document.getElementById('workButton');
        this.breakButton = document.getElementById('breakButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.ratioDisplay = document.getElementById('ratioDisplay');
        this.customInputs = document.getElementById('customInputs');
        this.customWork = document.getElementById('customWork');
        this.customBreak = document.getElementById('customBreak');
        this.pomodoroIcons = document.getElementById('pomodoroIcons');
        this.iconButton = document.getElementById('iconButton');
        this.iconSelector = document.getElementById('iconSelector');
        this.customIcon = document.getElementById('customIcon');
        this.soundToggle = document.getElementById('soundToggle');
        this.soundIcon = this.soundToggle.querySelector('.sound-icon');
        this.soundText = document.getElementById('soundText');
        this.resetButton = document.getElementById('resetButton');
        this.globalError = document.getElementById('globalError');
    }

    initializePiP() {
        if ('documentPictureInPicture' in window) {
            this.setupPiPHandlers();
        } else {
            this.pipButton.style.display = 'none';
        }
    }

    initializeWorkflowSettings() {
        this.workDurationMinutes = 25;
        this.breakDurationMinutes = 5;
        this.isUsingFixedDurations = false;
        this.currentRatio = 5;
    }

    setupEventListeners() {
        // Ensure 'this' is bound correctly in all event listeners
        this.workButton.addEventListener('click', () => this.toggleWorkTimer());
        this.breakButton.addEventListener('click', () => this.startBreakTimer());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.resetButton.addEventListener('click', () => this.resetTimer());

        // Setup workflow and icon handlers
        this.setupWorkflowHandlers();
        this.setupIconHandlers();

        // Add window unload handler to clean up intervals
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    cleanup() {
        // Clear all intervals when the page is unloaded
        if (this.workInterval) clearInterval(this.workInterval);
        if (this.breakInterval) clearInterval(this.breakInterval);
        if (this.pipWindow && !this.pipWindow.closed) {
            this.pipWindow.close();
        }
    }

    initializeDisplays() {
        this.updateBreakTimeDisplay();
        this.updateRatioDisplay();
        this.updatePomodoroIcons();
        this.updateButtonStates();
    }

    updateButtonStates() {
        // Update button states based on current timer state
        this.workButton.disabled = this.breakInterval !== null;
        this.breakButton.disabled = !this.hasWorkedSinceStart && !this.breakInterval;
        this.pauseButton.style.display = this.workInterval ? 'inline-block' : 'none';

        // Update button text based on current state
        this.workButton.textContent = this.workInterval ? 'Stop Work' : 'Start Work';
        this.breakButton.textContent = this.breakInterval ? 'Stop Break' : 'Take Break';
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    toggleWorkTimer() {
        try {
            if (this.workInterval) {
                this.stopWorkTimer();
            } else {
                this.startWorkTimer();
            }
            this.updateButtonStates();
        } catch (error) {
            console.error('Error in toggleWorkTimer:', error);
            this.showError('An error occurred while toggling the work timer');
        }
    }

    startWorkTimer() {
        try {
            this.playSound('ting');
            if (this.workInterval) clearInterval(this.workInterval);
            
            this.workInterval = setInterval(() => {
                if (!this.isPaused) {
                    this.workSeconds++;
                    this.hasWorkedSinceStart = true;
                    this.updateWorkTimeDisplay();
                    this.updatePomodoroProgress();

                    // Calculate break accumulation based on ratio
                    const breakAccumulationInterval = Math.ceil(this.currentRatio);
                    if (this.workSeconds % breakAccumulationInterval === 0) {
                        // Always increment break time when working
                        this.breakSeconds++;
                        this.updateBreakTimeDisplay();
                    }
                    
                    this.updateRatioDisplay();
                }
            }, 1000);
            
            this.workButton.textContent = 'Stop Work';
            this.updateButtonStates();
            this.isBreakActive = false;
        } catch (error) {
            console.error('Error in startWorkTimer:', error);
            this.showError('An error occurred while starting the work timer');
        }
    }

    startBreakTimer() {
        try {
            if (this.breakInterval) {
                this.stopBreakTimer();
                return;
            }

            // Check if user has worked at all
            if (!this.hasWorkedSinceStart && this.workSeconds === 0) {
                this.showError("You must work to earn break time!");
                return;
            }

            // Remove the check for negative break time to allow going into negative
            this.playSound('startBreak');
            this.isBreakActive = true;
            
            if (this.breakInterval) clearInterval(this.breakInterval);
            
            this.breakInterval = setInterval(() => {
                if (!this.isPaused) {
                    this.breakSeconds--;
                    
                    // Play sound only when transitioning to negative
                    if (this.breakSeconds === -1) {
                        this.playSound('breakEndAlarm');
                    }
                    
                    this.updateBreakTimeDisplay();
                    this.updateRatioDisplay();
                    
                    // Only count positive break time for ratio calculation
                    if (this.breakSeconds >= 0) {
                        this.totalBreakSeconds++;
                    }
                }
            }, 1000);

            // Update button states and text
            this.breakButton.textContent = 'Stop Break';
            this.workButton.disabled = true;
            this.pauseButton.style.display = 'none';
            
            if (this.pipWindow && !this.pipWindow.closed) {
                this.updatePiPButtonStates();
            }
        } catch (error) {
            console.error('Error in startBreakTimer:', error);
            this.showError('An error occurred while starting the break timer');
        }
    }

    setupWorkflowHandlers() {
        const workflowRadios = document.querySelectorAll('input[name="workflow"]');
        workflowRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleWorkflowChange(radio));
        });

        // Handle custom input changes
        this.customWork.addEventListener('change', () => this.updateCustomWorkflow());
        this.customBreak.addEventListener('change', () => this.updateCustomWorkflow());
    }

    setupIconHandlers() {
        // Toggle icon selector
        this.iconButton.addEventListener('click', () => {
            this.iconSelector.classList.toggle('visible');
        });

        // Handle icon selection
        document.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', () => {
                this.pomodoroIcon = option.dataset.icon;
                this.iconButton.textContent = this.pomodoroIcon;
                this.updatePreviewIcon(this.pomodoroIcon);
                this.iconSelector.classList.remove('visible');
                this.updatePomodoroIcons();
            });
        });

        // Handle custom icon input
        this.customIcon.addEventListener('input', (e) => {
            if (e.target.value) {
                this.pomodoroIcon = e.target.value;
                this.iconButton.textContent = this.pomodoroIcon;
                this.updatePreviewIcon(this.pomodoroIcon);
                this.updatePomodoroIcons();
            }
        });

        // Close icon selector when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.iconSelector.contains(e.target) && 
                !this.iconButton.contains(e.target)) {
                this.iconSelector.classList.remove('visible');
            }
        });

        // Initialize preview
        this.updatePreviewIcon(this.pomodoroIcon);
        
        // Animate preview
        this.startPreviewAnimation();
    }

    handleWorkflowChange(radio) {
        // Stop any running timers before changing workflow
        if (this.workInterval) this.stopWorkTimer();
        if (this.breakInterval) this.stopBreakTimer();

        // Reset timers and work status
        this.workSeconds = 0;
        this.breakSeconds = 0;
        this.totalBreakSeconds = 0;
        this.hasWorkedSinceStart = false;
        this.pomodoroCount = 0; // Reset Pomodoro count
        this.updateBreakTimeDisplay();
        this.updateWorkTimeDisplay();
        this.updatePomodoroIcons();

        // Show/hide icon-related elements based on workflow
        const isClassicWorkflow = radio.value === '25-5';
        
        // Toggle icon button visibility using the new class
        if (isClassicWorkflow) {
            this.iconButton.classList.remove('hidden');
        } else {
            this.iconButton.classList.add('hidden');
        }

        // Toggle pomodoro container visibility
        const pomodoroContainer = this.pomodoroIcons.parentElement;
        if (isClassicWorkflow) {
            pomodoroContainer.classList.remove('hidden');
        } else {
            pomodoroContainer.classList.add('hidden');
        }

        if (!isClassicWorkflow) {
            this.iconSelector.classList.remove('visible');
        }

        if (radio.value === 'custom') {
            this.customInputs.classList.add('visible');
            this.updateCustomWorkflow();
        } else {
            this.customInputs.classList.remove('visible');
            const [work, break_] = radio.value.split('-').map(Number);
            this.workDurationMinutes = work;
            this.breakDurationMinutes = break_;
            this.currentRatio = Math.round(work / break_);
            this.ratioDisplay.textContent = `${Math.round(work / break_)}:1`;
        }
    }

    updateCustomWorkflow() {
        const workMin = Math.max(1, Math.min(120, parseInt(this.customWork.value) || 25));
        const breakMin = Math.max(1, Math.min(30, parseInt(this.customBreak.value) || 5));
        
        this.workDurationMinutes = workMin;
        this.breakDurationMinutes = breakMin;
        this.currentRatio = Math.round(workMin / breakMin);
        
        // Update input values in case they were clamped
        this.customWork.value = workMin;
        this.customBreak.value = breakMin;
        
        // Update display with selected ratio
        this.ratioDisplay.textContent = `${this.currentRatio}:1`;
    }

    updateWorkTimeDisplay() {
        this.workTimer.textContent = this.formatTime(this.workSeconds);
        // Update PiP window if it exists
        if (this.pipWindow && !this.pipWindow.closed) {
            const pipWorkTimer = this.pipWindow.document.getElementById('workTimer');
            if (pipWorkTimer) {
                pipWorkTimer.textContent = this.formatTime(this.workSeconds);
            }
        }
    }

    calculateBreakTime() {
        // Calculate break time based on the current ratio
        return Math.floor(this.workSeconds / this.currentRatio);
    }

    /**
     * Formats time in seconds to MM:SS format, optionally showing negative sign
     * @param {number} seconds - The number of seconds to format
     * @param {boolean} [showNegative=false] - Whether to show negative sign for negative times
     * @returns {string} Formatted time string
     */
    formatTime(seconds, showNegative = false) {
        if (typeof seconds !== 'number') {
            seconds = 0;
        }
        const isNegative = seconds < 0;
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = absSeconds % 60;
        const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return (showNegative && isNegative) ? `-${timeString}` : timeString;
    }

    updateBreakTimeDisplay() {
        const isNegative = this.breakSeconds < 0;
        const absSeconds = Math.abs(this.breakSeconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = absSeconds % 60;
        const timeString = `${isNegative ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Set color to red for negative time
        this.breakTimer.style.color = isNegative ? '#ff4d4d' : '';
        this.breakTimer.textContent = timeString;

        // Enable break button if there's any break time or if already on break
        this.breakButton.disabled = !this.hasWorkedSinceStart && !this.breakInterval;

        // Update PiP window if it exists
        if (this.pipWindow && !this.pipWindow.closed) {
            const pipBreakTimer = this.pipWindow.document.getElementById('breakTimer');
            if (pipBreakTimer) {
                pipBreakTimer.textContent = timeString;
                pipBreakTimer.style.color = this.breakTimer.style.color;
            }
        }
    }

    updateRatioDisplay() {
        // Calculate actual work-to-break ratio
        if (this.totalBreakSeconds === 0) {
            this.actualRatio = this.currentRatio;
            return;
        }
        
        // Use absolute value of break seconds for ratio calculation
        const effectiveBreakTime = Math.max(this.totalBreakSeconds, 1); // Avoid division by zero
        const ratio = this.workSeconds / effectiveBreakTime;
        this.actualRatio = ratio;

        // Check if maintaining target ratio
        const targetRatio = this.currentRatio;
        const lowerBound = targetRatio * 0.9;
        const upperBound = targetRatio * 1.1;
        
        this.isOnTarget = (ratio >= lowerBound && ratio <= upperBound);
    }

    stopWorkTimer() {
        clearInterval(this.workInterval);
        this.workInterval = null;
        this.workButton.textContent = 'Start Work';
        this.isPaused = false;
        this.pauseButton.textContent = 'Pause';
        this.playSound('stopWork');
        // Don't reset the progress - keep it frozen until next start
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        // Progress freezes automatically since the main timer update is paused
    }

    stopBreakTimer() {
        clearInterval(this.breakInterval);
        this.breakInterval = null;
        this.isBreakStopped = true;
        this.isBreakActive = false;
        
        // Update button states and text
        this.breakButton.textContent = 'Take Break';
        this.workButton.disabled = false;
        this.workButton.textContent = 'Start Work';
        this.updateBreakTimeDisplay();
        this.playSound('stopBreak');

        if (this.pipWindow && !this.pipWindow.closed) {
            this.updatePiPButtonStates();
        }
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        this.soundIcon.textContent = this.isSoundEnabled ? '🔊' : '🔈';
        this.soundText.textContent = this.isSoundEnabled ? 'Sound On' : 'Sound Off';
    }

    async playSound(soundType) {
        if (!this.isSoundEnabled) return;
        try {
            switch (soundType) {
                case 'ting':
                    await window.soundEffects.playTing();
                    break;
                case 'breakEndAlarm':
                    await window.soundEffects.playBreakEndAlarm();
                    break;
                case 'stopWork':
                    await window.soundEffects.playStopWork();
                    break;
                case 'startBreak':
                    await window.soundEffects.playStartBreak();
                    break;
                case 'stopBreak':
                    await window.soundEffects.playStopBreak();
                    break;
            }
        } catch (error) {
            console.warn('Could not play sound effect:', error);
        }
    }

    showError(message) {
        try {
            if (!this.globalError) {
                this.globalError = document.getElementById('globalError');
            }
            
            if (this.globalError) {
                this.globalError.textContent = message;
                this.globalError.classList.add('visible');
                
                // Clear any existing timeout
                if (this.errorTimeout) {
                    clearTimeout(this.errorTimeout);
                }
                
                // Hide error after 3 seconds
                this.errorTimeout = setTimeout(() => {
                    this.globalError.classList.remove('visible');
                }, 3000);
            }
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }

    updatePomodoroProgress() {
        // Only update for Classic workflow
        if (this.workDurationMinutes !== 25) return;

        // Clear existing icons
        this.pomodoroIcons.innerHTML = '';
        
        // Calculate total completed pomodoros
        const completedPomodoros = Math.floor(this.workSeconds / (25 * 60));
        
        // Add completed pomodoros
        for (let i = 0; i < completedPomodoros; i++) {
            const completedIcon = document.createElement('div');
            completedIcon.className = 'progress-emoji';
            completedIcon.innerHTML = `
                <span class="progress-emoji-base">${this.pomodoroIcon}</span>
                <span class="progress-emoji-fill" style="--fill-percent: 100%">${this.pomodoroIcon}</span>
            `;
            this.pomodoroIcons.appendChild(completedIcon);
        }

        // Add current progress icon if there's any progress
        const currentProgress = this.workSeconds % (25 * 60);
        if (currentProgress > 0 || completedPomodoros === 0) {
            const progressIcon = document.createElement('div');
            progressIcon.className = 'progress-emoji';
            const fillPercent = (currentProgress / (25 * 60)) * 100;
            progressIcon.innerHTML = `
                <span class="progress-emoji-base">${this.pomodoroIcon}</span>
                <span class="progress-emoji-fill" style="--fill-percent: ${fillPercent}%">${this.pomodoroIcon}</span>
            `;
            this.pomodoroIcons.appendChild(progressIcon);
        }

        // Update pomodoro count silently
        if (completedPomodoros > this.pomodoroCount) {
            this.pomodoroCount = completedPomodoros;
        }

        // Ensure container height adjusts to content
        const totalRows = Math.ceil((completedPomodoros + (currentProgress > 0 ? 1 : 0)) / 5);
        this.pomodoroIcons.style.height = `${totalRows * 40}px`; // 30px height + 10px gap
    }

    updatePreviewIcon(icon) {
        const previewEmoji = document.getElementById('previewEmoji');
        previewEmoji.innerHTML = `
            <span class="progress-emoji-base">${icon}</span>
            <span class="progress-emoji-fill">${icon}</span>
        `;
    }

    startPreviewAnimation() {
        let fillPercent = 0;
        const previewFill = document.querySelector('#previewEmoji .progress-emoji-fill');
        
        const animate = () => {
            fillPercent = (fillPercent + 1) % 101;
            if (previewFill) {
                previewFill.style.setProperty('--fill-percent', `${fillPercent}%`);
            }
            setTimeout(animate, 30); // Slightly faster animation for preview
        };
        
        animate();
    }

    checkPomodoro() {
        // Only check for 25-5 workflow
        if (this.workDurationMinutes !== 25 || this.breakDurationMinutes !== 5) {
            return;
        }

        const currentPomodoroCount = Math.floor(this.workSeconds / (25 * 60));
        if (currentPomodoroCount > this.pomodoroCount) {
            this.pomodoroCount = currentPomodoroCount;
            this.updatePomodoroIcons();
        }
    }

    setupPiPHandlers() {
        // Handle PiP button click
        this.pipButton.addEventListener('click', async () => {
            try {
                if (!this.pipWindow) {
                    // Open PiP window
                    this.pipWindow = await documentPictureInPicture.requestWindow({
                        width: 400,
                        height: 200
                    });

                    // Copy styles to PiP window
                    const styles = document.getElementsByTagName('style');
                    for (const style of styles) {
                        this.pipWindow.document.head.appendChild(style.cloneNode(true));
                    }

                    // Move timer container to PiP window
                    const pipContainer = this.timerContainer.cloneNode(true);
                    this.pipWindow.document.body.appendChild(pipContainer);
                    this.timerContainer.style.visibility = 'hidden';

                    // Setup button handlers in PiP window
                    this.setupPiPButtonHandlers();

                    // Update button text
                    this.pipButton.querySelector('.pip-text').textContent = 'Restore Timer';

                    // Setup PiP window close handler
                    this.pipWindow.addEventListener('unload', () => {
                        this.timerContainer.style.visibility = 'visible';
                        this.pipWindow = null;
                        this.pipButton.querySelector('.pip-text').textContent = 'Minimize Timer (PiP)';
                    });

                    // Setup timer update handler for PiP window
                    this.setupPiPTimerUpdates();
                } else {
                    // Close PiP window
                    this.pipWindow.close();
                }
            } catch (error) {
                console.error('Error handling PiP:', error);
            }
        });
    }

    setupPiPButtonHandlers() {
        if (!this.pipWindow) return;

        // Get buttons in PiP window
        const pipWorkButton = this.pipWindow.document.getElementById('workButton');
        const pipBreakButton = this.pipWindow.document.getElementById('breakButton');
        const pipPauseButton = this.pipWindow.document.getElementById('pauseButton');
        const pipResetButton = this.pipWindow.document.getElementById('resetButton');

        // Work button handler
        pipWorkButton.addEventListener('click', () => {
            if (this.workInterval) {
                this.stopWorkTimer();
            } else {
                this.startWorkTimer();
            }
            this.updatePiPButtonStates();
        });

        // Break button handler
        pipBreakButton.addEventListener('click', () => {
            if (this.breakInterval) {
                this.stopBreakTimer();
            } else {
                this.startBreakTimer();
            }
            this.updatePiPButtonStates();
        });

        // Pause button handler
        pipPauseButton.addEventListener('click', () => {
            this.togglePause();
            this.updatePiPButtonStates();
        });

        // Reset button handler
        pipResetButton.addEventListener('click', () => {
            this.resetTimer();
        });
    }

    updatePiPButtonStates() {
        if (!this.pipWindow || this.pipWindow.closed) return;

        const pipWorkButton = this.pipWindow.document.getElementById('workButton');
        const pipBreakButton = this.pipWindow.document.getElementById('breakButton');
        const pipPauseButton = this.pipWindow.document.getElementById('pauseButton');

        // Update button states and text
        if (pipWorkButton) {
            pipWorkButton.textContent = this.workInterval ? 'Stop Work' : 'Start Work';
            pipWorkButton.disabled = this.breakInterval !== null;
        }

        if (pipBreakButton) {
            pipBreakButton.textContent = this.breakInterval ? 'Stop Break' : 'Take Break';
            pipBreakButton.disabled = (!this.hasWorkedSinceStart && !this.breakInterval);
        }

        if (pipPauseButton) {
            pipPauseButton.style.display = this.workInterval ? 'inline-block' : 'none';
            pipPauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }

    updatePiPTimerUpdates() {
        if (!this.pipWindow || this.pipWindow.closed) return;

        // Update timers
        const pipWorkTimer = this.pipWindow.document.getElementById('workTimer');
        const pipBreakTimer = this.pipWindow.document.getElementById('breakTimer');
        
        if (pipWorkTimer) {
            pipWorkTimer.textContent = this.formatTime(this.workSeconds);
        }
        if (pipBreakTimer) {
            pipBreakTimer.textContent = this.formatTime(this.breakSeconds, true);
            pipBreakTimer.style.color = this.breakSeconds < 0 ? '#ff4d4d' : '';
        }

        // Update button states
        this.updatePiPButtonStates();

        // Schedule next update
        setTimeout(() => this.updatePiPTimerUpdates(), 1000);
    }

    resetTimer() {
        // Stop any running intervals
        if (this.workInterval) {
            clearInterval(this.workInterval);
            this.workInterval = null;
        }
        if (this.breakInterval) {
            clearInterval(this.breakInterval);
            this.breakInterval = null;
        }

        // Reset all state variables
        this.workSeconds = 0;
        this.breakSeconds = 0;
        this.totalBreakSeconds = 0;
        this.isPaused = false;
        this.isBreakStopped = false;
        this.isBreakActive = false;
        this.hasWorkedSinceStart = false;
        this.pomodoroCount = 0;

        // Reset button text and states
        this.workButton.textContent = 'Start Work';
        this.breakButton.textContent = 'Take Break';
        this.pauseButton.textContent = 'Pause';
        this.workButton.disabled = false;
        this.breakButton.disabled = true;
        this.pauseButton.style.display = 'none';

        // Update all displays
        this.updateWorkTimeDisplay();
        this.updateBreakTimeDisplay();
        this.updateRatioDisplay();
        this.updatePomodoroIcons();

        // Play confirmation sound
        this.playSound('ting');

        // Update PiP window if it exists
        if (this.pipWindow && !this.pipWindow.closed) {
            this.updatePiPButtonStates();
        }
    }
}

// Initialize the timer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowTimer();
});
