/**
 * Quran Cloud API Service
 * Handles all API calls to alquran.cloud
 */
class QuranAPI {
    constructor() {
        this.baseURL = 'https://api.alquran.cloud/v1';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Make API request with caching
     */
    async request(endpoint, useCache = true) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Check cache first
        if (useCache && this.cache.has(url)) {
            const cached = this.cache.get(url);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            if (useCache) {
                this.cache.set(url, {
                    data: data,
                    timestamp: Date.now()
                });
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Get all available editions
     */
    async getEditions(format = null, language = null, type = null) {
        let endpoint = '/edition';
        const params = new URLSearchParams();
        
        if (format) params.append('format', format);
        if (language) params.append('language', language);
        if (type) params.append('type', type);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return await this.request(endpoint);
    }

    /**
     * Get all available languages
     */
    async getLanguages() {
        return await this.request('/edition/language');
    }

    /**
     * Get all available types
     */
    async getTypes() {
        return await this.request('/edition/type');
    }

    /**
     * Get all available formats
     */
    async getFormats() {
        return await this.request('/edition/format');
    }

    /**
     * Get list of all surahs
     */
    async getSurahs() {
        return await this.request('/surah');
    }

    /**
     * Get specific surah
     */
    async getSurah(surahNumber, edition = 'quran-uthmani') {
        return await this.request(`/surah/${surahNumber}/${edition}`);
    }

    /**
     * Get specific page
     */
    async getPage(pageNumber, edition = 'quran-uthmani') {
        return await this.request(`/page/${pageNumber}/${edition}`);
    }

    /**
     * Get specific ayah
     */
    async getAyah(reference, edition = 'quran-uthmani') {
        return await this.request(`/ayah/${reference}/${edition}`);
    }

    /**
     * Get ayah with multiple editions
     */
    async getAyahMultipleEditions(reference, editions) {
        const editionsStr = editions.join(',');
        return await this.request(`/ayah/${reference}/editions/${editionsStr}`);
    }

    /**
     * Search in Quran
     */
    async search(keyword, surah = 'all', edition = 'en') {
        return await this.request(`/search/${encodeURIComponent(keyword)}/${surah}/${edition}`);
    }

    /**
     * Get meta data
     */
    async getMeta() {
        return await this.request('/meta');
    }

    /**
     * Get available translations for a specific language
     */
    async getTranslations(language = 'en') {
        return await this.getEditions('text', language, 'translation');
    }

    /**
     * Get available audio reciters
     */
    async getReciters() {
        return await this.getEditions('audio', 'ar', 'versebyverse');
    }

    /**
     * Get Arabic text edition
     */
    async getArabicText() {
        return await this.getEditions('text', 'ar', 'versebyverse');
    }

    /**
     * Load surah data with Arabic text and translation
     */
    async loadSurahData(surahNumber, translationEdition = 'en.sahih') {
        try {
            const [arabicData, translationData] = await Promise.all([
                this.getSurah(surahNumber, 'quran-uthmani'),
                this.getSurah(surahNumber, translationEdition)
            ]);

            return {
                surah: arabicData.data,
                translation: translationData.data,
                arabicText: arabicData.data.ayahs,
                translationText: translationData.data.ayahs
            };
        } catch (error) {
            console.error('Error loading surah data:', error);
            throw error;
        }
    }

    /**
     * Load page data with Arabic text and translation
     */
    async loadPageData(pageNumber, translationEdition = 'en.sahih') {
        try {
            const [arabicData, translationData] = await Promise.all([
                this.getPage(pageNumber, 'quran-uthmani'),
                this.getPage(pageNumber, translationEdition)
            ]);

            return {
                page: arabicData.data,
                translation: translationData.data,
                arabicText: arabicData.data.ayahs,
                translationText: translationData.data.ayahs
            };
        } catch (error) {
            console.error('Error loading page data:', error);
            throw error;
        }
    }

    /**
     * Get audio URL for specific ayah
     */
    getAudioUrl(ayahNumber, reciter = 'ar.alafasy') {
        return `${this.baseURL}/ayah/${ayahNumber}/${reciter}`;
    }

    /**
     * Get audio URL for surah
     */
    getSurahAudioUrl(surahNumber, reciter = 'ar.alafasy') {
        return `${this.baseURL}/surah/${surahNumber}/${reciter}`;
    }

    /**
     * Get audio URL for page
     */
    getPageAudioUrl(pageNumber, reciter = 'ar.alafasy') {
        return `${this.baseURL}/page/${pageNumber}/${reciter}`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Export for use in other modules
window.QuranAPI = QuranAPI;
