/**
 * State Manager for Quran Application
 * Manages application state and synchronization
 */
class StateManager {
    constructor() {
        this.state = {
            // Current content
            currentSurah: null,
            currentPage: null,
            currentSurahName: null,
            currentSurahEnglishName: null,
            
            // Selected content
            highlightedAyah: null,
            selectedAyah: null,
            
            // Settings
            currentTranslation: 'en.sahih',
            currentReciter: 'ar.alafasy',
            
            // Audio state
            audioState: {
                isPlaying: false,
                isPaused: false,
                currentAyah: null,
                currentSurah: null,
                currentPage: null,
                reciter: 'ar.alafasy',
                timestamp: 0
            },
            
            // UI state
            isLoading: false,
            error: null,
            
            // Data
            arabicText: [],
            translationText: [],
            surahs: [],
            translations: [],
            reciters: []
        };
        
        this.callbacks = {
            onStateChange: null,
            onQuranStateChange: null,
            onAudioStateChange: null
        };
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    // State getters
    getState() {
        return { ...this.state };
    }
    
    getQuranState() {
        return {
            currentSurah: this.state.currentSurah,
            currentPage: this.state.currentPage,
            currentSurahName: this.state.currentSurahName,
            currentSurahEnglishName: this.state.currentSurahEnglishName,
            highlightedAyah: this.state.highlightedAyah,
            selectedAyah: this.state.selectedAyah,
            currentTranslation: this.state.currentTranslation,
            currentReciter: this.state.currentReciter
        };
    }
    
    getAudioState() {
        return { ...this.state.audioState };
    }
    
    // State setters
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(this.state, oldState);
        }
    }
    
    setQuranState(quranState) {
        const oldQuranState = this.getQuranState();
        this.state = { ...this.state, ...quranState };
        
        if (this.callbacks.onQuranStateChange) {
            this.callbacks.onQuranStateChange(quranState, oldQuranState);
        }
    }
    
    setAudioState(audioState) {
        const oldAudioState = this.getAudioState();
        this.state.audioState = { ...this.state.audioState, ...audioState };
        
        console.log('State manager audio state updated:', this.state.audioState);
        
        if (this.callbacks.onAudioStateChange) {
            this.callbacks.onAudioStateChange(audioState, oldAudioState);
        }
    }
    
    // Specific state updates
    setCurrentSurah(surahNumber, surahName = null, englishName = null) {
        this.setQuranState({
            currentSurah: surahNumber,
            currentSurahName: surahName,
            currentSurahEnglishName: englishName,
            currentPage: null // Clear page when switching to surah
        });
    }
    
    setCurrentPage(pageNumber) {
        this.setQuranState({
            currentPage: pageNumber,
            currentSurah: null, // Clear surah when switching to page
            currentSurahName: null,
            currentSurahEnglishName: null
        });
    }
    
    setHighlightedAyah(ayahNumber) {
        this.setQuranState({
            highlightedAyah: ayahNumber
        });
    }
    
    setSelectedAyah(ayah) {
        this.setQuranState({
            selectedAyah: ayah
        });
    }
    
    setCurrentTranslation(translation) {
        this.setQuranState({
            currentTranslation: translation
        });
    }
    
    setCurrentReciter(reciter) {
        this.setQuranState({
            currentReciter: reciter
        });
    }
    
    setArabicText(arabicText) {
        this.setState({
            arabicText: arabicText
        });
    }
    
    setTranslationText(translationText) {
        this.setState({
            translationText: translationText
        });
    }
    
    setSurahs(surahs) {
        this.setState({
            surahs: surahs
        });
    }
    
    setTranslations(translations) {
        this.setState({
            translations: translations
        });
    }
    
    setReciters(reciters) {
        this.setState({
            reciters: reciters
        });
    }
    
    setLoading(isLoading) {
        this.setState({
            isLoading: isLoading
        });
    }
    
    setError(error) {
        this.setState({
            error: error
        });
    }
    
    clearError() {
        this.setState({
            error: null
        });
    }
    
    // Audio state updates
    setAudioPlaying(isPlaying) {
        this.setAudioState({
            isPlaying: isPlaying,
            isPaused: false
        });
    }
    
    setAudioPaused(isPaused) {
        this.setAudioState({
            isPaused: isPaused,
            isPlaying: !isPaused
        });
    }
    
    setAudioStopped() {
        this.setAudioState({
            isPlaying: false,
            isPaused: false,
            currentAyah: null,
            currentSurah: null,
            currentPage: null,
            timestamp: 0
        });
    }
    
    setCurrentAudioAyah(ayahNumber) {
        this.setAudioState({
            currentAyah: ayahNumber,
            currentSurah: null,
            currentPage: null
        });
    }
    
    setCurrentAudioSurah(surahNumber) {
        this.setAudioState({
            currentSurah: surahNumber,
            currentAyah: null,
            currentPage: null
        });
    }
    
    setCurrentAudioPage(pageNumber) {
        this.setAudioState({
            currentPage: pageNumber,
            currentAyah: null,
            currentSurah: null
        });
    }
    
    setAudioReciter(reciter) {
        this.setAudioState({
            reciter: reciter
        });
    }
    
    setAudioTimestamp(timestamp) {
        this.setAudioState({
            timestamp: timestamp
        });
    }
    
    // State validation
    validateState() {
        const errors = [];
        
        // Validate surah and page are not both set
        if (this.state.currentSurah && this.state.currentPage) {
            errors.push('Cannot have both surah and page selected');
        }
        
        // Validate highlighted ayah exists in current content
        if (this.state.highlightedAyah) {
            const ayahExists = this.state.arabicText.some(ayah => ayah.number === this.state.highlightedAyah);
            if (!ayahExists) {
                errors.push('Highlighted ayah does not exist in current content');
            }
        }
        
        // Validate translation exists
        if (this.state.currentTranslation && this.state.translations.length > 0) {
            const translationExists = this.state.translations.some(t => t.identifier === this.state.currentTranslation);
            if (!translationExists) {
                errors.push('Selected translation does not exist');
            }
        }
        
        // Validate reciter exists
        if (this.state.currentReciter && this.state.reciters.length > 0) {
            const reciterExists = this.state.reciters.some(r => r.identifier === this.state.currentReciter);
            if (!reciterExists) {
                errors.push('Selected reciter does not exist');
            }
        }
        
        return errors;
    }
    
    // State reset
    reset() {
        this.state = {
            currentSurah: null,
            currentPage: null,
            currentSurahName: null,
            currentSurahEnglishName: null,
            highlightedAyah: null,
            selectedAyah: null,
            currentTranslation: 'en.sahih',
            currentReciter: 'ar.alafasy',
            audioState: {
                isPlaying: false,
                isPaused: false,
                currentAyah: null,
                currentSurah: null,
                currentPage: null,
                reciter: 'ar.alafasy',
                timestamp: 0
            },
            isLoading: false,
            error: null,
            arabicText: [],
            translationText: [],
            surahs: [],
            translations: [],
            reciters: []
        };
        
        if (this.callbacks.onStateChange) {
            this.callbacks.onStateChange(this.state, {});
        }
    }
    
    // State persistence
    saveToLocalStorage() {
        const stateToSave = {
            currentTranslation: this.state.currentTranslation,
            currentReciter: this.state.currentReciter,
            lastSurah: this.state.currentSurah,
            lastPage: this.state.currentPage
        };
        
        localStorage.setItem('quranAppState', JSON.stringify(stateToSave));
    }
    
    loadFromLocalStorage() {
        try {
            const savedState = localStorage.getItem('quranAppState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.setState(parsedState);
            }
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
        }
    }
    
    // State synchronization
    getStateForSync() {
        return {
            quranState: this.getQuranState(),
            audioState: this.getAudioState()
        };
    }
    
    applySyncState(syncState) {
        if (syncState.quranState) {
            this.setQuranState(syncState.quranState);
        }
        
        if (syncState.audioState) {
            this.setAudioState(syncState.audioState);
        }
    }
}

// Export for use in other modules
window.StateManager = StateManager;
