/**
 * Audio Manager for Quran Recitation
 * Handles audio playback, synchronization, and reciter selection
 */
class AudioManager {
    constructor() {
        this.audio = new Audio();
        this.currentReciter = 'ar.alafasy';
        this.isPlaying = false;
        this.isPaused = false;
        this.currentAyah = null;
        this.currentSurah = null;
        this.currentPage = null;
        this.audioQueue = [];
        this.isController = false;
        
        // Audio state for synchronization
        this.audioState = {
            isPlaying: false,
            isPaused: false,
            currentAyah: null,
            currentSurah: null,
            currentPage: null,
            reciter: this.currentReciter,
            timestamp: 0
        };
        
        this.callbacks = {
            onPlay: null,
            onPause: null,
            onStop: null,
            onAyahComplete: null,
            onError: null
        };
        
        this.setupAudioEvents();
    }
    
    setupAudioEvents() {
        this.audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('Audio can start playing');
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.updateAudioState();
            
            if (this.callbacks.onPlay) {
                this.callbacks.onPlay();
            }
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPaused = true;
            this.updateAudioState();
            
            if (this.callbacks.onPause) {
                this.callbacks.onPause();
            }
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.updateAudioState();
            
            if (this.callbacks.onAyahComplete) {
                this.callbacks.onAyahComplete(this.currentAyah);
            }
            
            // Auto-play next ayah if in queue
            this.playNextInQueue();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.isPlaying = false;
            this.isPaused = false;
            this.updateAudioState();
            
            if (this.callbacks.onError) {
                this.callbacks.onError(e);
            }
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.audioState.timestamp = this.audio.currentTime;
        });
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    setController(isController) {
        this.isController = isController;
    }
    
    /**
     * Set the current reciter
     */
    setReciter(reciter) {
        this.currentReciter = reciter;
        this.audioState.reciter = reciter;
        console.log('Reciter set to:', reciter);
    }
    
    /**
     * Play specific ayah
     */
    async playAyah(ayahNumber, surahNumber = null) {
        try {
            this.currentAyah = ayahNumber;
            this.currentSurah = surahNumber;
            
            const apiUrl = this.getAyahAudioUrl(ayahNumber);
            console.log('Fetching audio from API:', apiUrl);
            
            // First fetch the API response to get the actual audio URL
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            
            // Extract the audio URL from the response
            let audioUrl = null;
            if (data.data && data.data.audio) {
                audioUrl = data.data.audio;
            } else if (data.data && data.data.audioFiles && data.data.audioFiles.length > 0) {
                audioUrl = data.data.audioFiles[0].url;
            } else {
                throw new Error('No audio URL found in API response');
            }
            
            console.log('Audio URL:', audioUrl);
            
            await this.loadAudio(audioUrl);
            await this.play();
            
            this.updateAudioState();
            
        } catch (error) {
            console.error('Error playing ayah:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }
    
    /**
     * Play specific surah
     */
    async playSurah(surahNumber) {
        try {
            this.currentSurah = surahNumber;
            this.currentAyah = null;
            
            const audioUrl = this.getSurahAudioUrl(surahNumber);
            await this.loadAudio(audioUrl);
            await this.play();
            
            this.updateAudioState();
            
        } catch (error) {
            console.error('Error playing surah:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }
    
    /**
     * Play specific page
     */
    async playPage(pageNumber) {
        try {
            this.currentPage = pageNumber;
            this.currentAyah = null;
            this.currentSurah = null;
            
            const audioUrl = this.getPageAudioUrl(pageNumber);
            await this.loadAudio(audioUrl);
            await this.play();
            
            this.updateAudioState();
            
        } catch (error) {
            console.error('Error playing page:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }
    
    /**
     * Load audio from URL
     */
    async loadAudio(url) {
        return new Promise((resolve, reject) => {
            this.audio.src = url;
            this.audio.load();
            
            const onCanPlay = () => {
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                resolve();
            };
            
            const onError = (e) => {
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                reject(e);
            };
            
            this.audio.addEventListener('canplay', onCanPlay);
            this.audio.addEventListener('error', onError);
        });
    }
    
    /**
     * Play audio
     */
    async play() {
        try {
            await this.audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }
    
    /**
     * Pause audio
     */
    pause() {
        this.audio.pause();
    }
    
    /**
     * Stop audio
     */
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.updateAudioState();
        
        if (this.callbacks.onStop) {
            this.callbacks.onStop();
        }
    }
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * Get audio URL for specific ayah
     */
    getAyahAudioUrl(ayahNumber) {
        // The Quran Cloud API returns JSON with audio URL, not direct audio
        // We need to fetch the JSON first, then get the audio URL
        return `https://api.alquran.cloud/v1/ayah/${ayahNumber}/${this.currentReciter}`;
    }
    
    /**
     * Get audio URL for specific surah
     */
    getSurahAudioUrl(surahNumber) {
        return `https://api.alquran.cloud/v1/surah/${surahNumber}/${this.currentReciter}`;
    }
    
    /**
     * Get audio URL for specific page
     */
    getPageAudioUrl(pageNumber) {
        return `https://api.alquran.cloud/v1/page/${pageNumber}/${this.currentReciter}`;
    }
    
    /**
     * Add ayah to queue
     */
    addToQueue(ayahNumber, surahNumber = null) {
        this.audioQueue.push({ ayahNumber, surahNumber });
    }
    
    /**
     * Play next item in queue
     */
    async playNextInQueue() {
        if (this.audioQueue.length > 0) {
            const next = this.audioQueue.shift();
            await this.playAyah(next.ayahNumber, next.surahNumber);
        }
    }
    
    /**
     * Clear audio queue
     */
    clearQueue() {
        this.audioQueue = [];
    }
    
    /**
     * Update audio state for synchronization
     */
    updateAudioState() {
        this.audioState = {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentAyah: this.currentAyah,
            currentSurah: this.currentSurah,
            currentPage: this.currentPage,
            reciter: this.currentReciter,
            timestamp: this.audio.currentTime
        };
        
        console.log('Audio manager updating state:', this.audioState);
        
        // Notify state manager if callback is set
        if (this.callbacks && this.callbacks.onAudioStateChange) {
            console.log('Notifying state manager of audio state change');
            this.callbacks.onAudioStateChange(this.audioState);
        }
    }
    
    /**
     * Get current audio state
     */
    getAudioState() {
        this.updateAudioState();
        return { ...this.audioState };
    }
    
    /**
     * Apply audio state from synchronization
     */
    async applyAudioState(audioState) {
        console.log('Client applying audio state:', audioState);
        console.log('Client isController:', this.isController);
        
        if (!this.isController) {
            // Only listeners should apply external audio state
            this.currentReciter = audioState.reciter;
            this.currentAyah = audioState.currentAyah;
            this.currentSurah = audioState.currentSurah;
            this.currentPage = audioState.currentPage;
            
            console.log('Client audio state updated - currentAyah:', this.currentAyah, 'isPlaying:', audioState.isPlaying);
            
            // If there's a current ayah and we should be playing, load and play it
            if (audioState.isPlaying && this.currentAyah) {
                try {
                    console.log('Client loading audio for ayah:', this.currentAyah);
                    await this.playAyah(this.currentAyah, this.currentSurah);
                } catch (error) {
                    console.error('Error playing ayah on client:', error);
                }
            } else if (!audioState.isPlaying && this.isPlaying) {
                this.pause();
            }
        }
    }
    
    /**
     * Get available reciters
     */
    async getAvailableReciters() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar&type=versebyverse');
            const data = await response.json();
            
            return data.data.map(edition => ({
                identifier: edition.identifier,
                name: edition.name,
                englishName: edition.englishName,
                format: edition.format,
                type: edition.type
            }));
        } catch (error) {
            console.error('Error fetching reciters:', error);
            return [];
        }
    }
    
    /**
     * Get current playback position
     */
    getCurrentTime() {
        return this.audio.currentTime;
    }
    
    /**
     * Get audio duration
     */
    getDuration() {
        return this.audio.duration || 0;
    }
    
    /**
     * Seek to specific time
     */
    seekTo(time) {
        this.audio.currentTime = time;
    }
    
    /**
     * Set volume
     */
    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Get volume
     */
    getVolume() {
        return this.audio.volume;
    }
    
    /**
     * Check if audio is ready
     */
    isReady() {
        return this.audio.readyState >= 2; // HAVE_CURRENT_DATA
    }
    
    /**
     * Get audio loading progress
     */
    getLoadingProgress() {
        if (this.audio.buffered.length > 0) {
            const buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
            const duration = this.audio.duration;
            return duration > 0 ? (buffered / duration) * 100 : 0;
        }
        return 0;
    }
}

// Export for use in other modules
window.AudioManager = AudioManager;
