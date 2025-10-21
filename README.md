# القرآن المتزامن - Synchronized Quran

A WebRTC-based synchronized Quran reading application that allows a controller to guide listeners through Quranic text with real-time highlighting, translations, and audio playback.

## Features

- **Real-time Synchronization**: WebRTC peer-to-peer communication for instant updates
- **Controller/Listener System**: One user controls the session, others follow along
- **Arabic Text Display**: Beautiful Arabic typography with proper RTL support
- **Interactive Highlighting**: Click on any ayah to highlight it for all participants
- **Multiple Translations**: Support for various translation editions
- **Audio Recitation**: Play audio for individual ayahs or entire surahs/pages
- **Multiple Reciters**: Choose from various Quran reciters
- **Controller Messages**: Send text messages to all participants
- **Page/Surah Navigation**: Navigate by page number or surah selection
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. **Open the application**: Simply open `index.html` in a modern web browser
2. **Create a room**: Click "إنشاء غرفة" (Create Room) and enter your name
3. **Share room ID**: Give the generated room ID to participants
4. **Join session**: Others can enter the room ID and click "انضمام" (Join)
5. **Start reading**: The controller can select surahs/pages and highlight ayahs

## How to Use

### For Controllers (Room Creators)

1. **Create a room** and wait for participants to join
2. **Select content** using the surah dropdown or page navigation
3. **Click on ayahs** to highlight them for all participants
4. **Choose translation** from the translation dropdown
5. **Select reciter** from the reciter dropdown
6. **Control audio** using play/pause/stop buttons
7. **Send messages** using the text input at the bottom

### For Listeners (Room Joiners)

1. **Join a room** using the room ID provided by the controller
2. **Follow along** as the controller highlights ayahs
3. **View translations** in the right sidebar
4. **Listen to audio** synchronized with the controller
5. **Read messages** from the controller

## Technical Details

### Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Tailwind CSS with custom Arabic RTL support
- **Networking**: WebRTC for peer-to-peer communication
- **API**: Quran Cloud API for Quranic data
- **Audio**: HTML5 Audio API with multiple reciter support

### Components

- **QuranAPI**: Handles all API calls to alquran.cloud
- **WebRTCManager**: Manages peer-to-peer connections and synchronization
- **AudioManager**: Controls audio playback and reciter selection
- **UIManager**: Handles all user interface interactions
- **StateManager**: Manages application state and persistence

### Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## API Integration

The application uses the [Quran Cloud API](https://alquran.cloud/api) for:

- Arabic text (Uthmani script)
- Multiple translations (English, French, etc.)
- Audio recitations from various reciters
- Surah and page data
- Ayah-specific information

## WebRTC Implementation

- **Signaling**: Uses localStorage-based signaling for local testing
- **STUN Servers**: Google STUN servers for NAT traversal
- **Data Channels**: Real-time synchronization of Quran state
- **Connection Management**: Automatic reconnection and error handling

## File Structure

```
├── index.html              # Main HTML file
├── style.css               # Custom styling and Arabic RTL support
├── js/
│   ├── quran-api.js        # Quran Cloud API integration
│   ├── webrtc-manager.js   # WebRTC networking
│   ├── audio-manager.js    # Audio playback and synchronization
│   ├── ui-manager.js       # UI state and component management
│   ├── state-manager.js    # Application state management
│   └── main.js             # Main application controller
├── TASKS.md                # Development task list
└── README.md               # This file
```

## Development

### Prerequisites

- Modern web browser with WebRTC support
- Local web server (for testing) or GitHub Pages (for hosting)

### Local Development

1. Clone or download the repository
2. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser

### Deployment

The application can be deployed to any static hosting service:

- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder or connect to Git
- **Vercel**: Import the project and deploy
- **Any web server**: Upload files to any web server

## Features in Detail

### Arabic Text Display

- Beautiful Amiri font for authentic Arabic typography
- Proper RTL (right-to-left) text direction
- Interactive ayah highlighting
- Responsive design for different screen sizes

### Audio Features

- Multiple reciter support
- Individual ayah playback
- Full surah/page recitation
- Synchronized audio across all participants
- Play/pause/stop controls

### Synchronization

- Real-time ayah highlighting
- Page/surah navigation sync
- Translation selection sync
- Audio state synchronization
- Controller message broadcasting

### User Interface

- Clean, modern Arabic interface
- Intuitive controls for both controllers and listeners
- Real-time participant list
- Connection status indicators
- Responsive design for mobile devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Credits

- **Quran Cloud API**: For providing comprehensive Quranic data
- **Amiri Font**: For beautiful Arabic typography
- **Tailwind CSS**: For utility-first CSS framework
- **WebRTC**: For peer-to-peer communication
- **Google STUN Servers**: For NAT traversal

---

**بارك الله فيكم - May Allah bless you**
