/**
 * Main Application Controller
 * Coordinates all components and manages the application flow
 */
class QuranApp {
    constructor() {
        this.quranAPI = new QuranAPI();
        this.webrtcManager = new WebRTCManager();
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager();
        this.stateManager = new StateManager();
        
        this.isInitialized = false;
        this.isController = false;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('Initializing Quran App...');
            
            // Set up callbacks
            this.setupCallbacks();
            
            // Load initial data
            await this.loadInitialData();
            
            // Load saved state
            this.stateManager.loadFromLocalStorage();
            
            this.isInitialized = true;
            console.log('Quran App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Quran App:', error);
            this.uiManager.showError('خطأ في تهيئة التطبيق');
        }
    }
    
    setupCallbacks() {
        // WebRTC callbacks
        this.webrtcManager.setCallbacks({
            onUserJoin: (user) => {
                console.log('User joined:', user.name);
                this.updateParticipantsList();
            },
            
            onUserLeave: (user) => {
                console.log('User left:', user.name);
                this.updateParticipantsList();
            },
            
            onConnectionStatusChange: (status, roomId) => {
                this.uiManager.updateConnectionStatus(status, roomId);
            },
            
            onQuranStateUpdate: (state) => {
                this.applyQuranState(state);
            },
            
            onControllerMessage: (message) => {
                this.uiManager.addControllerMessage(message);
            },
            
            onAudioStateUpdate: (audioState) => {
                this.applyAudioState(audioState);
            }
        });
        
        // UI callbacks
        this.uiManager.setCallbacks({
            onCreateRoom: (userName) => {
                this.createRoom(userName);
            },
            
            onJoinRoom: (roomId, userName) => {
                this.joinRoom(roomId, userName);
            },
            
            onSurahChange: (surahNumber) => {
                this.loadSurah(surahNumber);
            },
            
            onPageChange: (pageNumber) => {
                this.loadPage(pageNumber);
            },
            
            onAyahClick: (ayah, translationAyah) => {
                this.handleAyahClick(ayah, translationAyah);
            },
            
            onTranslationChange: (translation) => {
                this.changeTranslation(translation);
            },
            
            onReciterChange: (reciter) => {
                this.changeReciter(reciter);
            },
            
            onPlayPause: () => {
                this.toggleAudio();
            },
            
            onStop: () => {
                this.stopAudio();
            },
            
            onControllerMessage: (message) => {
                this.sendControllerMessage(message);
            }
        });
        
        // State manager callbacks
        this.stateManager.setCallbacks({
            onQuranStateChange: (newState, oldState) => {
                this.handleQuranStateChange(newState, oldState);
            },
            
            onAudioStateChange: (newState, oldState) => {
                this.handleAudioStateChange(newState, oldState);
            }
        });
        
        // Audio manager callbacks
        this.audioManager.setCallbacks({
            onPlay: () => {
                this.stateManager.setAudioPlaying(true);
                this.uiManager.updateAudioState(true, false, this.stateManager.getState().currentReciter);
            },
            
            onPause: () => {
                this.stateManager.setAudioPaused(true);
                this.uiManager.updateAudioState(false, true, this.stateManager.getState().currentReciter);
            },
            
            onStop: () => {
                this.stateManager.setAudioStopped();
                this.uiManager.updateAudioState(false, false, this.stateManager.getState().currentReciter);
            },
            
            onAyahComplete: (ayahNumber) => {
                console.log('Ayah completed:', ayahNumber);
            },
            
            onError: (error) => {
                console.error('Audio error:', error);
                this.uiManager.showError('خطأ في تشغيل الصوت');
            }
        });
    }
    
    async loadInitialData() {
        try {
            this.stateManager.setLoading(true);
            
            // Load surahs
            const surahsResponse = await this.quranAPI.getSurahs();
            this.stateManager.setSurahs(surahsResponse.data);
            
            // Load translations
            const translationsResponse = await this.quranAPI.getTranslations();
            this.stateManager.setTranslations(translationsResponse.data);
            
            // Load reciters
            const recitersResponse = await this.quranAPI.getReciters();
            this.stateManager.setReciters(recitersResponse.data);
            
            this.stateManager.setLoading(false);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.stateManager.setLoading(false);
            throw error;
        }
    }
    
    // Room management
    async createRoom(userName) {
        try {
            const roomId = await this.webrtcManager.createRoom(userName);
            this.isController = true;
            this.audioManager.setController(true);
            this.uiManager.setController(true);
            
            console.log('Room created:', roomId);
            
        } catch (error) {
            console.error('Error creating room:', error);
            this.uiManager.showError('خطأ في إنشاء الغرفة');
        }
    }
    
    async joinRoom(roomId, userName) {
        try {
            await this.webrtcManager.joinRoom(roomId, userName);
            this.isController = false;
            this.audioManager.setController(false);
            this.uiManager.setController(false);
            
            console.log('Joined room:', roomId);
            
        } catch (error) {
            console.error('Error joining room:', error);
            this.uiManager.showError('خطأ في الانضمام للغرفة');
        }
    }
    
    // Content loading
    async loadSurah(surahNumber) {
        try {
            this.stateManager.setLoading(true);
            
            const surahData = await this.quranAPI.loadSurahData(surahNumber, this.stateManager.getState().currentTranslation);
            
            this.stateManager.setCurrentSurah(surahNumber, surahData.surah.name, surahData.surah.englishName);
            this.stateManager.setArabicText(surahData.arabicText);
            this.stateManager.setTranslationText(surahData.translationText);
            
            this.uiManager.displayQuranText(surahData.arabicText, surahData.translationText);
            this.uiManager.updateSurahTitle(surahData.surah.name, surahNumber);
            
            // Broadcast state if controller
            if (this.isController) {
                this.broadcastQuranState();
            }
            
            this.stateManager.setLoading(false);
            
        } catch (error) {
            console.error('Error loading surah:', error);
            this.stateManager.setLoading(false);
            this.uiManager.showError('خطأ في تحميل السورة');
        }
    }
    
    async loadPage(pageNumber) {
        try {
            this.stateManager.setLoading(true);
            
            const pageData = await this.quranAPI.loadPageData(pageNumber, this.stateManager.getState().currentTranslation);
            
            this.stateManager.setCurrentPage(pageNumber);
            this.stateManager.setArabicText(pageData.arabicText);
            this.stateManager.setTranslationText(pageData.translationText);
            
            this.uiManager.displayQuranText(pageData.arabicText, pageData.translationText);
            this.uiManager.updatePageTitle(pageNumber);
            this.uiManager.updatePageInput(pageNumber);
            
            // Broadcast state if controller
            if (this.isController) {
                this.broadcastQuranState();
            }
            
            this.stateManager.setLoading(false);
            
        } catch (error) {
            console.error('Error loading page:', error);
            this.stateManager.setLoading(false);
            this.uiManager.showError('خطأ في تحميل الصفحة');
        }
    }
    
    // Ayah handling
    handleAyahClick(ayah, translationAyah) {
        this.stateManager.setSelectedAyah(ayah);
        this.stateManager.setHighlightedAyah(ayah.number);
        
        // Play audio if controller
        if (this.isController) {
            this.audioManager.playAyah(ayah.number, this.stateManager.getState().currentSurah);
        }
        
        // Broadcast state if controller
        if (this.isController) {
            this.broadcastQuranState();
        }
    }
    
    // Translation and reciter changes
    changeTranslation(translation) {
        this.stateManager.setCurrentTranslation(translation);
        
        // Reload current content with new translation
        if (this.stateManager.getState().currentSurah) {
            this.loadSurah(this.stateManager.getState().currentSurah);
        } else if (this.stateManager.getState().currentPage) {
            this.loadPage(this.stateManager.getState().currentPage);
        }
        
        // Broadcast state if controller
        if (this.isController) {
            this.broadcastQuranState();
        }
    }
    
    changeReciter(reciter) {
        this.stateManager.setCurrentReciter(reciter);
        this.audioManager.setReciter(reciter);
        
        // Broadcast state if controller
        if (this.isController) {
            this.broadcastQuranState();
        }
    }
    
    // Audio control
    toggleAudio() {
        this.audioManager.togglePlayPause();
    }
    
    stopAudio() {
        this.audioManager.stop();
    }
    
    // Controller messaging
    sendControllerMessage(message) {
        if (this.isController) {
            this.webrtcManager.broadcastControllerMessage(message);
            this.uiManager.addControllerMessage({
                text: message,
                timestamp: Date.now(),
                from: this.webrtcManager.getLocalUser().name
            });
        }
    }
    
    // State synchronization
    broadcastQuranState() {
        if (this.isController) {
            const quranState = this.stateManager.getQuranState();
            this.webrtcManager.broadcastQuranState(quranState);
        }
    }
    
    broadcastAudioState() {
        if (this.isController) {
            const audioState = this.stateManager.getAudioState();
            this.webrtcManager.broadcastAudioState(audioState);
        }
    }
    
    applyQuranState(state) {
        this.stateManager.setQuranState(state);
        this.uiManager.updateFromQuranState(state);
        
        // Update audio if needed
        if (state.highlightedAyah) {
            this.uiManager.highlightAyah(state.highlightedAyah);
        }
    }
    
    applyAudioState(audioState) {
        this.stateManager.setAudioState(audioState);
        this.audioManager.applyAudioState(audioState);
        this.uiManager.updateAudioState(audioState.isPlaying, audioState.isPaused, audioState.reciter);
    }
    
    // State change handlers
    handleQuranStateChange(newState, oldState) {
        // Save state to localStorage
        this.stateManager.saveToLocalStorage();
        
        // Update UI
        this.uiManager.updateFromQuranState(newState);
    }
    
    handleAudioStateChange(newState, oldState) {
        // Update UI
        this.uiManager.updateAudioState(newState.isPlaying, newState.isPaused, newState.reciter);
    }
    
    // Participant management
    updateParticipantsList() {
        const allUsers = this.webrtcManager.getAllUsers();
        this.uiManager.updateParticipants(allUsers);
    }
    
    // Public API
    getState() {
        return this.stateManager.getState();
    }
    
    getQuranState() {
        return this.stateManager.getQuranState();
    }
    
    getAudioState() {
        return this.stateManager.getAudioState();
    }
    
    isControllerMode() {
        return this.isController;
    }
    
    isConnected() {
        return this.webrtcManager.connections.size > 0 || this.webrtcManager.isHost;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quranApp = new QuranApp();
    console.log('Quran App instance created and attached to window.quranApp');
});
