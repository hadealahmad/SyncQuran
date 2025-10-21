/**
 * UI Manager for Quran Application
 * Handles all UI interactions, updates, and state management
 */
class UIManager {
    constructor() {
        this.currentSurah = null;
        this.currentPage = null;
        this.currentTranslation = 'en.sahih';
        this.currentReciter = 'ar.alafasy';
        this.selectedAyah = null;
        this.highlightedAyah = null;
        this.isController = false;
        
        this.callbacks = {
            onSurahChange: null,
            onPageChange: null,
            onAyahClick: null,
            onTranslationChange: null,
            onReciterChange: null,
            onPlayPause: null,
            onStop: null,
            onControllerMessage: null
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialData();
    }
    
    initializeElements() {
        // Connection elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.roomIdInput = document.getElementById('roomId');
        this.createRoomBtn = document.getElementById('createRoom');
        this.joinRoomBtn = document.getElementById('joinRoom');
        
        // Navigation elements
        this.surahSelect = document.getElementById('surahSelect');
        this.pageInput = document.getElementById('pageInput');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        
        // Translation and reciter elements
        this.translationSelect = document.getElementById('translationSelect');
        this.reciterSelect = document.getElementById('reciterSelect');
        
        // Audio control elements
        this.playPauseBtn = document.getElementById('playPause');
        this.stopBtn = document.getElementById('stopAudio');
        this.playIcon = document.getElementById('playIcon');
        
        // Controller message elements
        this.controllerMessageInput = document.getElementById('controllerMessage');
        this.sendMessageBtn = document.getElementById('sendMessage');
        
        // Display elements
        this.quranText = document.getElementById('quranText');
        this.currentSurahTitle = document.getElementById('currentSurah');
        this.currentPageTitle = document.getElementById('currentPage');
        this.selectedAyahTranslation = document.getElementById('selectedAyahTranslation');
        this.selectedAyahNumber = document.getElementById('selectedAyahNumber');
        this.selectedAyahText = document.getElementById('selectedAyahText');
        this.controllerMessages = document.getElementById('controllerMessages');
        this.participantsList = document.getElementById('participantsList');
        
        // Audio status elements
        this.currentReciterDisplay = document.getElementById('currentReciter');
        this.audioStateDisplay = document.getElementById('audioState');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    
    setupEventListeners() {
        // Connection events
        this.createRoomBtn.addEventListener('click', () => {
            this.handleCreateRoom();
        });
        
        this.joinRoomBtn.addEventListener('click', () => {
            this.handleJoinRoom();
        });
        
        // Navigation events
        this.surahSelect.addEventListener('change', (e) => {
            this.handleSurahChange(e.target.value);
        });
        
        this.pageInput.addEventListener('change', (e) => {
            this.handlePageChange(parseInt(e.target.value));
        });
        
        this.prevPageBtn.addEventListener('click', () => {
            const currentPage = parseInt(this.pageInput.value) || 1;
            if (currentPage > 1) {
                this.handlePageChange(currentPage - 1);
            }
        });
        
        this.nextPageBtn.addEventListener('click', () => {
            const currentPage = parseInt(this.pageInput.value) || 1;
            if (currentPage < 604) {
                this.handlePageChange(currentPage + 1);
            }
        });
        
        // Translation and reciter events
        this.translationSelect.addEventListener('change', (e) => {
            this.handleTranslationChange(e.target.value);
        });
        
        this.reciterSelect.addEventListener('change', (e) => {
            this.handleReciterChange(e.target.value);
        });
        
        // Audio control events
        this.playPauseBtn.addEventListener('click', () => {
            this.handlePlayPause();
        });
        
        this.stopBtn.addEventListener('click', () => {
            this.handleStop();
        });
        
        // Controller message events
        this.sendMessageBtn.addEventListener('click', () => {
            this.handleSendMessage();
        });
        
        this.controllerMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    setController(isController) {
        this.isController = isController;
        
        // Enable/disable controller-specific controls
        const controllerControls = [
            this.surahSelect,
            this.pageInput,
            this.prevPageBtn,
            this.nextPageBtn,
            this.translationSelect,
            this.reciterSelect,
            this.playPauseBtn,
            this.stopBtn,
            this.controllerMessageInput,
            this.sendMessageBtn
        ];
        
        controllerControls.forEach(control => {
            control.disabled = !isController;
        });
    }
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Load surahs
            await this.loadSurahs();
            
            // Load translations
            await this.loadTranslations();
            
            // Load reciters
            await this.loadReciters();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showLoading(false);
        }
    }
    
    async loadSurahs() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            
            this.surahSelect.innerHTML = '<option value="">اختر السورة</option>';
            
            data.data.forEach(surah => {
                const option = document.createElement('option');
                option.value = surah.number;
                option.textContent = `${surah.number}. ${surah.name} (${surah.englishName})`;
                this.surahSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading surahs:', error);
        }
    }
    
    async loadTranslations() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/edition?format=text&language=en&type=translation');
            const data = await response.json();
            
            this.translationSelect.innerHTML = '<option value="">اختر الترجمة</option>';
            
            data.data.forEach(edition => {
                const option = document.createElement('option');
                option.value = edition.identifier;
                option.textContent = edition.name;
                this.translationSelect.appendChild(option);
            });
            
            // Set default translation
            this.translationSelect.value = 'en.sahih';
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }
    
    async loadReciters() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar&type=versebyverse');
            const data = await response.json();
            
            this.reciterSelect.innerHTML = '<option value="">اختر القارئ</option>';
            
            data.data.forEach(edition => {
                const option = document.createElement('option');
                option.value = edition.identifier;
                option.textContent = edition.name;
                this.reciterSelect.appendChild(option);
            });
            
            // Set default reciter
            this.reciterSelect.value = 'ar.alafasy';
        } catch (error) {
            console.error('Error loading reciters:', error);
        }
    }
    
    // Event handlers
    handleCreateRoom() {
        const userName = prompt('أدخل اسمك:') || 'مستخدم';
        if (this.callbacks.onCreateRoom) {
            this.callbacks.onCreateRoom(userName);
        }
    }
    
    handleJoinRoom() {
        const roomId = this.roomIdInput.value.trim();
        const userName = prompt('أدخل اسمك:') || 'مستخدم';
        
        if (!roomId) {
            alert('يرجى إدخال رقم الغرفة');
            return;
        }
        
        if (this.callbacks.onJoinRoom) {
            this.callbacks.onJoinRoom(roomId, userName);
        }
    }
    
    handleSurahChange(surahNumber) {
        if (surahNumber && this.callbacks.onSurahChange) {
            this.callbacks.onSurahChange(parseInt(surahNumber));
        }
    }
    
    handlePageChange(pageNumber) {
        if (pageNumber && this.callbacks.onPageChange) {
            this.callbacks.onPageChange(pageNumber);
        }
    }
    
    handleTranslationChange(translation) {
        this.currentTranslation = translation;
        if (this.callbacks.onTranslationChange) {
            this.callbacks.onTranslationChange(translation);
        }
    }
    
    handleReciterChange(reciter) {
        this.currentReciter = reciter;
        if (this.callbacks.onReciterChange) {
            this.callbacks.onReciterChange(reciter);
        }
    }
    
    handlePlayPause() {
        if (this.callbacks.onPlayPause) {
            this.callbacks.onPlayPause();
        }
    }
    
    handleStop() {
        if (this.callbacks.onStop) {
            this.callbacks.onStop();
        }
    }
    
    handleSendMessage() {
        const message = this.controllerMessageInput.value.trim();
        if (message && this.callbacks.onControllerMessage) {
            this.callbacks.onControllerMessage(message);
            this.controllerMessageInput.value = '';
        }
    }
    
    // UI Update methods
    updateConnectionStatus(status, roomId = null) {
        this.statusText.textContent = status;
        
        if (roomId) {
            this.roomIdInput.value = roomId;
        }
        
        // Update connection indicator
        this.connectionStatus.className = 'w-3 h-3 rounded-full';
        
        if (status.includes('Connected') || status.includes('Room Created')) {
            this.connectionStatus.classList.add('bg-green-500');
        } else if (status.includes('Joining') || status.includes('Connecting')) {
            this.connectionStatus.classList.add('bg-yellow-500');
        } else {
            this.connectionStatus.classList.add('bg-red-500');
        }
    }
    
    updateParticipants(users) {
        this.participantsList.innerHTML = '';
        
        users.forEach(user => {
            const li = document.createElement('li');
            li.className = 'flex items-center space-x-2 space-x-reverse text-sm';
            
            const indicator = document.createElement('div');
            indicator.className = 'w-2 h-2 rounded-full bg-green-500';
            
            const name = document.createElement('span');
            name.textContent = user.name;
            
            const role = document.createElement('span');
            role.className = 'text-gray-500 text-xs';
            role.textContent = user.role === 'controller' ? '(مرشد)' : '(مستمع)';
            
            li.appendChild(indicator);
            li.appendChild(name);
            li.appendChild(role);
            this.participantsList.appendChild(li);
        });
    }
    
    displayQuranText(ayahs, translationAyahs = null) {
        this.quranText.innerHTML = '';
        
        ayahs.forEach((ayah, index) => {
            const ayahElement = document.createElement('div');
            ayahElement.className = 'ayah';
            ayahElement.dataset.ayahNumber = ayah.number;
            ayahElement.dataset.surahNumber = ayah.surahNumber;
            
            // Arabic text
            const arabicText = document.createElement('span');
            arabicText.className = 'arabic-text';
            arabicText.textContent = ayah.text;
            
            // Ayah number
            const ayahNumber = document.createElement('span');
            ayahNumber.className = 'ayah-number';
            ayahNumber.textContent = ayah.number;
            
            ayahElement.appendChild(arabicText);
            ayahElement.appendChild(ayahNumber);
            
            // Add click event
            ayahElement.addEventListener('click', () => {
                this.handleAyahClick(ayah, translationAyahs ? translationAyahs[index] : null);
            });
            
            this.quranText.appendChild(ayahElement);
        });
    }
    
    handleAyahClick(ayah, translationAyah = null) {
        this.selectedAyah = ayah;
        
        // Update highlighted ayah
        this.clearHighlight();
        const ayahElement = document.querySelector(`[data-ayah-number="${ayah.number}"]`);
        if (ayahElement) {
            ayahElement.classList.add('highlighted');
            this.highlightedAyah = ayah.number;
        }
        
        // Update translation display
        this.updateTranslationDisplay(ayah, translationAyah);
        
        if (this.callbacks.onAyahClick) {
            this.callbacks.onAyahClick(ayah, translationAyah);
        }
    }
    
    updateTranslationDisplay(ayah, translationAyah) {
        this.selectedAyahNumber.textContent = `الآية ${ayah.number}`;
        this.selectedAyahText.textContent = translationAyah ? translationAyah.text : 'لا توجد ترجمة متاحة';
    }
    
    clearHighlight() {
        const highlighted = document.querySelector('.ayah.highlighted');
        if (highlighted) {
            highlighted.classList.remove('highlighted');
        }
        this.highlightedAyah = null;
    }
    
    highlightAyah(ayahNumber) {
        this.clearHighlight();
        const ayahElement = document.querySelector(`[data-ayah-number="${ayahNumber}"]`);
        if (ayahElement) {
            ayahElement.classList.add('highlighted');
            this.highlightedAyah = ayahNumber;
        }
    }
    
    updateSurahTitle(surahName, surahNumber) {
        this.currentSurahTitle.textContent = `${surahNumber}. ${surahName}`;
    }
    
    updatePageTitle(pageNumber) {
        this.currentPageTitle.textContent = `الصفحة ${pageNumber}`;
    }
    
    updatePageInput(pageNumber) {
        this.pageInput.value = pageNumber;
    }
    
    updateSurahSelect(surahNumber) {
        this.surahSelect.value = surahNumber;
    }
    
    addControllerMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-bubble';
        
        const text = document.createElement('div');
        text.textContent = message.text;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'text-xs text-gray-500 mt-1';
        timestamp.textContent = new Date(message.timestamp).toLocaleTimeString('ar-SA');
        
        messageElement.appendChild(text);
        messageElement.appendChild(timestamp);
        
        this.controllerMessages.appendChild(messageElement);
        
        // Scroll to bottom
        this.controllerMessages.scrollTop = this.controllerMessages.scrollHeight;
    }
    
    updateAudioState(isPlaying, isPaused, reciter) {
        if (isPlaying) {
            this.playIcon.textContent = '⏸️';
            this.audioStateDisplay.textContent = 'يعمل';
        } else if (isPaused) {
            this.playIcon.textContent = '▶️';
            this.audioStateDisplay.textContent = 'متوقف مؤقتاً';
        } else {
            this.playIcon.textContent = '▶️';
            this.audioStateDisplay.textContent = 'متوقف';
        }
        
        if (reciter) {
            this.currentReciterDisplay.textContent = reciter;
        }
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
    
    showError(message) {
        alert(message);
    }
    
    // Public methods for external updates
    updateFromQuranState(state) {
        if (state.currentSurah) {
            this.updateSurahTitle(state.surahName, state.currentSurah);
            this.updateSurahSelect(state.currentSurah);
        }
        
        if (state.currentPage) {
            this.updatePageTitle(state.currentPage);
            this.updatePageInput(state.currentPage);
        }
        
        if (state.highlightedAyah) {
            this.highlightAyah(state.highlightedAyah);
        }
        
        if (state.translation) {
            this.currentTranslation = state.translation;
            this.translationSelect.value = state.translation;
        }
        
        if (state.reciter) {
            this.currentReciter = state.reciter;
            this.reciterSelect.value = state.reciter;
        }
    }
}

// Export for use in other modules
window.UIManager = UIManager;
