# القرآن المتزامن - Synchronized Quran

A proof-of-concept WebRTC application designed to help Quran teachers and guides share their reading sessions with students, allowing them to follow along more easily through real-time highlighting and synchronized content.

## Current Features (Proof of Concept)

- **Basic Synchronization**: WebRTC peer-to-peer communication for real-time updates
- **Controller/Student System**: Teacher controls the session, students follow along
- **Arabic Text Display**: Basic Arabic typography with RTL support
- **Ayah Highlighting**: Click on ayahs to highlight them for all participants
- **Translation Support**: Basic translation display functionality
- **Audio Playback**: Simple audio controls for recitation
- **Room-based Sessions**: Create and join reading sessions

## Quick Start (Testing)

1. **Open the application**: Open `index.html` in a modern web browser
2. **Create a room**: Click "إنشاء غرفة" (Create Room) and enter your name
3. **Share room ID**: Give the generated room ID to students
4. **Join session**: Students enter the room ID and click "انضمام" (Join)
5. **Test functionality**: Teacher can select content and highlight ayahs

## How to Use (Proof of Concept)

### For Teachers (Room Creators)

1. **Create a room** and wait for students to join
2. **Select content** using the available navigation options
3. **Click on ayahs** to highlight them for all students
4. **Test basic features** like translation and audio controls
5. **Note limitations** and areas needing improvement

### For Students (Room Joiners)

1. **Join a room** using the room ID provided by the teacher
2. **Follow along** as the teacher highlights ayahs
3. **Test the interface** and provide feedback
4. **Note any issues** or missing features

## Technical Details (Current Implementation)

### Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Tailwind CSS with basic Arabic RTL support
- **Networking**: WebRTC for peer-to-peer communication (experimental)
- **API**: Quran Cloud API for Quranic data
- **Audio**: Basic HTML5 Audio API implementation

### Components

- **QuranAPI**: Basic API integration with alquran.cloud
- **WebRTCManager**: Experimental peer-to-peer connection management
- **AudioManager**: Simple audio playback controls
- **UIManager**: Basic user interface management
- **StateManager**: Simple application state handling

### Browser Compatibility (Limited Testing)

- **Chrome/Chromium**: Basic functionality tested
- **Firefox**: Limited testing
- **Safari**: Not fully tested
- **Edge**: Not fully tested

## API Integration (Basic)

The application uses the [Quran Cloud API](https://alquran.cloud/api) for:

- Arabic text (Uthmani script)
- Basic translation support
- Limited audio recitation options
- Surah and page data
- Ayah information

## WebRTC Implementation (Experimental)

- **Signaling**: Basic localStorage-based signaling for local testing
- **STUN Servers**: Google STUN servers for NAT traversal
- **Data Channels**: Basic real-time synchronization
- **Connection Management**: Limited error handling and reconnection

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

## Development (Proof of Concept)

### Prerequisites

- Modern web browser with WebRTC support
- Local web server for testing

### Local Testing

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
4. Test with multiple browser tabs/windows to simulate multiple users

### Current Limitations

- **WebRTC Stability**: Connection issues may occur
- **Audio Synchronization**: Not fully implemented
- **Mobile Support**: Limited testing on mobile devices
- **Error Handling**: Basic error handling only
- **UI/UX**: Needs significant improvement

## Current Implementation Details

### Arabic Text Display (Basic)

- Amiri font for Arabic typography
- Basic RTL (right-to-left) text direction
- Simple ayah highlighting
- Limited responsive design

### Audio Features (Limited)

- Basic reciter support
- Simple audio playback
- Limited synchronization
- Basic play/pause controls

### Synchronization (Experimental)

- Basic real-time ayah highlighting
- Limited page/surah navigation sync
- Basic translation selection sync
- Limited audio state synchronization

### User Interface (Needs Improvement)

- Basic Arabic interface
- Simple controls for teachers and students
- Basic participant list
- Limited connection status indicators

## Future Development Goals

This proof of concept aims to evolve into a more robust tool for Quran teachers. Future improvements should include:

- **Improved WebRTC Stability**: Better connection management and error handling
- **Enhanced Audio Synchronization**: More reliable audio sharing across participants
- **Better Mobile Support**: Optimized interface for mobile devices
- **Advanced UI/UX**: More intuitive and polished user interface
- **Multiple Language Support**: Support for various translation languages
- **Recording Features**: Ability to record sessions for later review
- **User Management**: Better user authentication and session management

## Contributing

This is a proof of concept project. Contributions are welcome but please note:

1. This is experimental software with known limitations
2. Focus on core functionality improvements
3. Test thoroughly with multiple users
4. Consider the educational use case

## License

This project is open source and available under the MIT License.

## Credits

- **Quran Cloud API**: For providing Quranic data
- **Amiri Font**: For Arabic typography
- **Tailwind CSS**: For CSS framework
- **WebRTC**: For peer-to-peer communication
- **Google STUN Servers**: For NAT traversal

---

**بارك الله فيكم - May Allah bless you**
