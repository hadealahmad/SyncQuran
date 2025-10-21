# Project Overview: Synchronized Quran

A WebRTC-based real-time Quran reading application enabling one controller to guide multiple listeners through Quranic text with synchronized highlighting, translations, and audio playback.

## Technologies

### Frontend
- **HTML5**: Semantic structure with Arabic RTL support
- **CSS3**: Custom styling with Tailwind CSS framework
- **Vanilla JavaScript**: No frameworks, modular ES6 classes
- **WebRTC**: Peer-to-peer communication via PeerJS
- **HTML5 Audio API**: Synchronized audio playback

### External Services
- **Quran Cloud API**: Quranic data (text, translations, audio)
- **PeerJS**: Free WebRTC signaling service
- **Google STUN Servers**: NAT traversal

## WebRTC Concepts

### PeerJS
PeerJS is a JavaScript library that simplifies WebRTC implementation by providing:
- **Signaling Server**: Facilitates initial connection between peers
- **Peer ID Generation**: Creates unique identifiers for each client
- **Connection Management**: Handles WebRTC peer connection setup
- **Data Channel Abstraction**: Simplifies real-time data transmission

### STUN Servers
STUN (Session Traversal Utilities for NAT) servers enable:
- **NAT Traversal**: Allows peers behind firewalls to connect
- **Public IP Discovery**: Finds the public IP address of clients
- **Port Mapping**: Discovers which ports are available for communication
- **Connection Establishment**: Enables direct peer-to-peer connections

### WebRTC Data Channels
- **Real-time Communication**: Instant message delivery between peers
- **Reliable Transmission**: Ensures message delivery with retry mechanisms
- **Bidirectional**: Both peers can send and receive data simultaneously
- **Low Latency**: Direct peer connections without server intermediaries

## Core Concepts

### State Synchronization
- **Controller-Listener Pattern**: One user controls session, others follow
- **Real-time Broadcasting**: State changes propagate instantly to all clients
- **Bidirectional Communication**: Data channels for instant message delivery
- **State Persistence**: LocalStorage for session recovery

### WebRTC Implementation
- **Peer-to-Peer**: Direct connections between clients
- **Data Channels**: Reliable message transmission
- **Connection Management**: Automatic reconnection and error handling
- **Room System**: Unique room IDs for session isolation

### Audio Synchronization
- **State Broadcasting**: Audio state shared across all clients
- **Multiple Reciters**: Support for various Quran reciters
- **Ayah-level Control**: Individual verse playback
- **Synchronized Playback**: All clients play same audio simultaneously

## Architecture

### Component Structure
```
QuranApp (main.js)
├── QuranAPI (quran-api.js) - External API integration
├── WebRTCManager (webrtc-manager-peerjs.js) - P2P communication
├── AudioManager (audio-manager.js) - Audio playback control
├── UIManager (ui-manager.js) - Interface management
└── StateManager (state-manager.js) - Application state
```

### Data Flow
1. Controller selects content (surah/page) or highlights ayah
2. State change triggers broadcast via WebRTC
3. All connected clients receive and apply state update
4. UI updates reflect synchronized state across all clients
5. Audio state synchronized for simultaneous playback

## Key Files

### Core Application
- **`main.js`**: Main controller coordinating all components
- **`index.html`**: Application structure with Arabic UI
- **`style.css`**: Custom styling and RTL support

### Managers
- **`state-manager.js`**: Centralized state management and persistence
- **`ui-manager.js`**: DOM manipulation and user interface
- **`audio-manager.js`**: Audio playback and synchronization
- **`webrtc-manager-peerjs.js`**: WebRTC communication layer
- **`quran-api.js`**: External API integration with caching

## WebRTC Limitations

### Connection Constraints
- **NAT Traversal**: Requires STUN servers for network traversal
- **Firewall Issues**: Corporate networks may block WebRTC
- **Browser Compatibility**: Limited to modern browsers
- **PeerJS Dependency**: Relies on external signaling service

### Technical Limitations
- **No Central Server**: P2P architecture means no persistent state
- **Connection Stability**: Direct connections can be unstable
- **Scalability**: Limited by peer connection count
- **Signaling Dependency**: Requires external service for initial connection

### Workarounds Implemented
- **Multiple STUN Servers**: Fallback options for connection
- **PeerJS Fallback**: Multiple server options for reliability
- **Manual Room Sharing**: Alternative to automatic discovery
- **Connection Retry**: Automatic reconnection attempts

## State Management

### Quran State
- Current surah/page selection
- Highlighted ayah tracking
- Translation and reciter preferences
- Arabic text and translation data

### Audio State
- Play/pause/stop status
- Current ayah being played
- Reciter selection
- Synchronization timestamps

### UI State
- Loading states and error handling
- Participant list management
- Connection status indicators
- Modal and form states

## API Integration

### Quran Cloud API
- **Endpoints**: Surah list, page data, translations, audio
- **Caching**: 5-minute cache for performance
- **Error Handling**: Graceful fallback for API failures
- **Data Processing**: Structured data for application use

### Data Structure
- **Arabic Text**: Uthmani script with ayah metadata
- **Translations**: Multiple language support
- **Audio URLs**: Direct links to recitation files
- **Metadata**: Surah names, page numbers, ayah counts

## User Experience

### Controller Features
- Create rooms and manage participants
- Navigate by surah or page
- Highlight individual ayahs
- Control audio playback
- Send messages to listeners
- Select translations and reciters

### Listener Features
- Join existing rooms
- Follow controller's highlighting
- View synchronized translations
- Listen to synchronized audio
- Receive controller messages
- See participant list

## Technical Decisions

### Why WebRTC
- **Real-time**: Instant synchronization without server round-trips
- **Scalability**: P2P reduces server load
- **Privacy**: No data stored on external servers
- **Cost**: No server infrastructure required

### Why PeerJS
- **Simplicity**: Abstracts WebRTC complexity
- **Free Service**: No cost for signaling
- **Reliability**: Multiple server fallbacks
- **Browser Support**: Wide compatibility

### Why Vanilla JavaScript
- **Performance**: No framework overhead
- **Simplicity**: Direct DOM manipulation
- **Compatibility**: Works in all modern browsers
- **Maintainability**: Clear, readable code structure

## Deployment

### Static Hosting
- **GitHub Pages**: Free hosting for static files
- **Netlify/Vercel**: Alternative hosting options
- **Any Web Server**: Standard HTTP hosting

### Requirements
- **HTTPS**: Required for WebRTC in production
- **Modern Browser**: WebRTC support required
- **Internet Connection**: For API calls and P2P connections

## Future Considerations

### Potential Improvements
- **Server Backup**: Fallback signaling server
- **Mobile Optimization**: Touch-friendly interface
- **Offline Support**: Cached content for offline reading
- **Advanced Features**: Search, bookmarks, notes
- **Performance**: Code splitting and lazy loading

### Scalability
- **Hybrid Architecture**: P2P with server backup
- **Connection Pooling**: Optimize peer connections
- **State Persistence**: Server-side state storage
- **Load Balancing**: Multiple signaling servers
