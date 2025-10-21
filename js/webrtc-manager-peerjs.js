/**
 * WebRTC Manager using PeerJS for Quran Synchronization
 * Uses free PeerJS signaling server instead of custom server
 */
class WebRTCManagerPeerJS {
    constructor() {
        this.localUser = null;
        this.remoteUsers = new Map();
        this.connections = new Map();
        this.isHost = false;
        this.roomId = null;
        this.peer = null;
        
        // WebRTC configuration with Google STUN servers
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        this.callbacks = {
            onUserJoin: null,
            onUserLeave: null,
            onUserUpdate: null,
            onConnectionStatusChange: null,
            onQuranStateUpdate: null,
            onControllerMessage: null,
            onAudioStateUpdate: null
        };
        
        this.initializePeer();
    }
    
    initializePeer() {
        // Generate a unique peer ID
        const peerId = 'quran_' + Math.random().toString(36).substr(2, 9);
        
        // List of free PeerJS servers to try
        const servers = [
            { host: '0.peerjs.com', port: 443, secure: true },
            { host: 'peerjs-server.herokuapp.com', port: 443, secure: true },
            { host: 'peerjs.herokuapp.com', port: 443, secure: true }
        ];
        
        this.tryPeerJSServers(peerId, servers, 0);
    }
    
    // Method to reinitialize with a specific peer ID (for host)
    initializePeerWithId(peerId) {
        // List of free PeerJS servers to try
        const servers = [
            { host: '0.peerjs.com', port: 443, secure: true },
            { host: 'peerjs-server.herokuapp.com', port: 443, secure: true },
            { host: 'peerjs.herokuapp.com', port: 443, secure: true }
        ];
        
        this.tryPeerJSServers(peerId, servers, 0);
    }
    
    tryPeerJSServers(peerId, servers, index) {
        if (index >= servers.length) {
            console.error('All PeerJS servers failed, falling back to local mode');
            this.setupFallbackMode();
            return;
        }
        
        const server = servers[index];
        console.log(`Trying PeerJS server: ${server.host}:${server.port}`);
        
        // Initialize PeerJS with current server
        this.peer = new Peer(peerId, {
            host: server.host,
            port: server.port,
            path: '/',
            secure: server.secure,
            config: this.rtcConfig
        });
        
        this.peer.on('open', (id) => {
            this.updateConnectionStatus('PeerJS Connected');
        });
        
        this.peer.on('connection', (conn) => {
            this.handleIncomingConnection(conn);
        });
        
        this.peer.on('disconnected', () => {
            this.updateConnectionStatus('PeerJS Disconnected');
            setTimeout(() => {
                if (this.peer && this.peer.destroyed) {
                    this.initializePeer();
                }
            }, 3000);
        });
        
        this.peer.on('error', (error) => {
            console.error(`PeerJS error with ${server.host}:`, error);
            setTimeout(() => {
                if (this.peer && this.peer.destroyed) {
                    this.tryPeerJSServers(peerId, servers, index + 1);
                }
            }, 1000);
        });
    }
    
    setupFallbackMode() {
        this.updateConnectionStatus('Local Mode (No Server)');
        
        this.peer = {
            id: 'quran_' + Math.random().toString(36).substr(2, 9),
            destroyed: false,
            connect: (peerId) => ({
                peer: peerId,
                open: true,
                send: (data) => {},
                close: () => {},
                on: () => {}
            }),
            destroy: () => {
                this.peer.destroyed = true;
            }
        };
        
        this.startLocalPolling();
    }
    
    startLocalPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.lastMessageIndex = 0;
        
        this.pollingInterval = setInterval(() => {
            if (!this.roomId) return;
            
            const key = 'quran_signaling_' + this.roomId;
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            
            for (let i = this.lastMessageIndex; i < messages.length; i++) {
                const message = messages[i];
                if (message.from !== this.localUser?.id) {
                    this.handleSignalingMessage(message);
                }
            }
            
            this.lastMessageIndex = messages.length;
        }, 100);
    }
    
    handleSignalingMessage(message) {
        const peerId = message.from;
        
        try {
            switch (message.type) {
                case 'join-request':
                    if (this.isHost && message.roomId === this.roomId) {
                        // Fallback mode: Cannot create real peer connections
                    }
                    break;
                    
                case 'user-join':
                    this.addRemoteUser(message.userData, peerId);
                    break;
                    
                case 'user-update':
                    this.updateRemoteUser(message.userData, peerId);
                    break;
                    
                case 'quran-state-update':
                    if (this.callbacks.onQuranStateUpdate) {
                        this.callbacks.onQuranStateUpdate(message.state);
                    }
                    break;
                    
                case 'controller-message':
                    if (this.callbacks.onControllerMessage) {
                        this.callbacks.onControllerMessage(message.message);
                    }
                    break;
                    
                case 'audio-state-update':
                    if (this.callbacks.onAudioStateUpdate) {
                        this.callbacks.onAudioStateUpdate(message.audioState);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling signaling message:', error);
        }
    }
    
    handleIncomingConnection(conn) {
        const peerId = conn.peer;
        
        conn.on('open', () => {
            console.log('Connection opened with:', peerId);
            this.connections.set(peerId, conn);
            
            // Send initial user data
            this.broadcastUserUpdate();
        });
        
        conn.on('data', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleQuranMessage(message, peerId);
            } catch (error) {
                console.error('Error parsing message from', peerId, ':', error);
            }
        });
        
        conn.on('close', () => {
            console.log('Connection closed with:', peerId);
            this.handleUserDisconnect(peerId);
        });
        
        conn.on('error', (error) => {
            console.error('Connection error with', peerId, ':', error);
        });
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    async createRoom(userName) {
        this.roomId = this.generateRoomId();
        this.isHost = true;
        
        this.localUser = {
            id: this.peer.id,
            name: userName,
            role: 'controller',
            isHost: true
        };
        
        // Store the host's actual peer ID for room discovery
        this.storeRoomInfo();
        
        this.updateConnectionStatus('Room Created: ' + this.roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Host', this.roomId);
        }
        
        console.log('Quran room created with ID:', this.roomId, 'User ID:', this.localUser.id);
        console.log('Host peer ID for clients to connect:', this.localUser.id);
        
        return this.roomId;
    }
    
    storeRoomInfo() {
        const roomInfo = {
            roomId: this.roomId,
            hostPeerId: this.peer.id,
            hostName: this.localUser.name,
            createdAt: Date.now()
        };
        
        // Store in localStorage for room discovery
        const roomsKey = 'quran_rooms';
        const rooms = JSON.parse(localStorage.getItem(roomsKey) || '{}');
        rooms[this.roomId] = roomInfo;
        localStorage.setItem(roomsKey, JSON.stringify(rooms));
        
        console.log('Room info stored:', roomInfo);
    }
    
    getRoomInfo(roomId) {
        const roomsKey = 'quran_rooms';
        const rooms = JSON.parse(localStorage.getItem(roomsKey) || '{}');
        return rooms[roomId] || null;
    }
    
    async joinRoom(roomId, userName, hostPeerId) {
        this.roomId = roomId;
        this.isHost = false;
        
        this.localUser = {
            id: this.peer.id,
            name: userName,
            role: 'listener',
            isHost: false
        };
        
        console.log('Joining Quran room:', roomId, 'User ID:', this.localUser.id);
        console.log('Connecting to host peer ID:', hostPeerId);
        
        try {
            const conn = this.peer.connect(hostPeerId);
            this.handleOutgoingConnection(conn, hostPeerId);
        } catch (error) {
            console.error('Failed to connect to host:', error);
            this.updateConnectionStatus('Failed to connect to host');
        }
        
        this.updateConnectionStatus('Joining Room: ' + roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Joining', roomId);
        }
    }
    
    handleOutgoingConnection(conn, peerId) {
        conn.on('open', () => {
            console.log('Connected to host:', peerId);
            this.connections.set(peerId, conn);
            this.updateConnectionStatus('Connected to Host');
            
            // Send initial user data
            this.broadcastUserUpdate();
        });
        
        conn.on('data', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleQuranMessage(message, peerId);
            } catch (error) {
                console.error('Error parsing message from', peerId, ':', error);
            }
        });
        
        conn.on('close', () => {
            console.log('Disconnected from host:', peerId);
            this.handleUserDisconnect(peerId);
        });
        
        conn.on('error', (error) => {
            console.error('Connection error with host', peerId, ':', error);
        });
    }
    
    handleQuranMessage(data, peerId) {
        console.log('Received Quran message:', data.type, 'from:', peerId);
        
        switch (data.type) {
            case 'user-update':
                this.updateRemoteUser(data.userData, peerId);
                break;
                
            case 'user-join':
                this.addRemoteUser(data.userData, peerId);
                break;
                
            case 'user-leave':
                this.removeRemoteUser(peerId);
                break;
                
            case 'quran-state-update':
                if (this.callbacks.onQuranStateUpdate) {
                    this.callbacks.onQuranStateUpdate(data.state);
                }
                break;
                
            case 'controller-message':
                if (this.callbacks.onControllerMessage) {
                    this.callbacks.onControllerMessage(data.message);
                }
                break;
                
            case 'audio-state-update':
                if (this.callbacks.onAudioStateUpdate) {
                    this.callbacks.onAudioStateUpdate(data.audioState);
                }
                break;
        }
    }
    
    updateRemoteUser(userData, peerId) {
        let user = this.remoteUsers.get(peerId);
        
        if (!user) {
            user = { ...userData };
            this.remoteUsers.set(peerId, user);
            
            if (this.callbacks.onUserJoin) {
                this.callbacks.onUserJoin(user);
            }
        } else {
            Object.assign(user, userData);
        }
        
        if (this.callbacks.onUserUpdate) {
            this.callbacks.onUserUpdate(user);
        }
    }
    
    addRemoteUser(userData, peerId) {
        const user = { ...userData };
        this.remoteUsers.set(peerId, user);
        
        if (this.callbacks.onUserJoin) {
            this.callbacks.onUserJoin(user);
        }
    }
    
    removeRemoteUser(peerId) {
        const user = this.remoteUsers.get(peerId);
        if (user) {
            this.remoteUsers.delete(peerId);
            
            if (this.callbacks.onUserLeave) {
                this.callbacks.onUserLeave(user);
            }
        }
    }
    
    handleUserDisconnect(peerId) {
        this.removeRemoteUser(peerId);
        
        const connection = this.connections.get(peerId);
        if (connection) {
            connection.close();
            this.connections.delete(peerId);
        }
        
        this.updateConnectionStatus('User Disconnected');
    }
    
    // Quran-specific broadcast methods
    broadcastQuranState(state) {
        if (!this.isHost) return; // Only controller can broadcast state
        
        const message = {
            type: 'quran-state-update',
            state: state
        };
        
        this.broadcastMessage(message);
    }
    
    broadcastControllerMessage(message) {
        if (!this.isHost) return; // Only controller can broadcast messages
        
        const data = {
            type: 'controller-message',
            message: {
                text: message,
                timestamp: Date.now(),
                from: this.localUser.name
            }
        };
        
        this.broadcastMessage(data);
    }
    
    broadcastAudioState(audioState) {
        if (!this.isHost) return; // Only controller can broadcast audio state
        
        const message = {
            type: 'audio-state-update',
            audioState: audioState
        };
        
        this.broadcastMessage(message);
    }
    
    broadcastUserUpdate() {
        if (!this.localUser) return;
        
        const message = {
            type: 'user-update',
            userData: this.localUser
        };
        
        this.broadcastMessage(message);
    }
    
    broadcastMessage(message) {
        // If using fallback mode, store in localStorage
        if (this.peer && this.peer.destroyed === false && !this.peer.on) {
            // Fallback mode - use localStorage
            const key = 'quran_signaling_' + this.roomId;
            const messages = JSON.parse(localStorage.getItem(key) || '[]');
            const messageWithMetadata = {
                ...message,
                from: this.localUser?.id,
                timestamp: Date.now()
            };
            messages.push(messageWithMetadata);
            localStorage.setItem(key, JSON.stringify(messages));
            console.log('Fallback: Stored message in localStorage:', message.type);
            return;
        }
        
        // Normal mode - send via connections
        this.connections.forEach((connection, peerId) => {
            if (connection && connection.open) {
                try {
                    connection.send(JSON.stringify(message));
                } catch (error) {
                    console.warn(`Failed to send message to ${peerId}:`, error);
                }
            }
        });
    }
    
    updateConnectionStatus(status) {
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange(status);
        }
    }
    
    generateRoomId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    getLocalUser() {
        return this.localUser;
    }
    
    getRemoteUsers() {
        return Array.from(this.remoteUsers.values());
    }
    
    getAllUsers() {
        const users = [];
        if (this.localUser) users.push(this.localUser);
        users.push(...this.getRemoteUsers());
        return users;
    }
    
    isController() {
        return this.isHost && this.localUser?.role === 'controller';
    }
    
    disconnect() {
        // Close all connections
        this.connections.forEach((connection) => {
            connection.close();
        });
        this.connections.clear();
        
        // Destroy peer
        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
        }
        
        // Clear users
        this.remoteUsers.clear();
        this.localUser = null;
        
        this.updateConnectionStatus('Disconnected');
    }
    
    // Debug function to check connection status
    getDebugInfo() {
        return {
            isHost: this.isHost,
            roomId: this.roomId,
            localUser: this.localUser,
            connections: Array.from(this.connections.keys()),
            remoteUsers: Array.from(this.remoteUsers.keys()),
            peerId: this.peer ? this.peer.id : null,
            peerDestroyed: this.peer ? this.peer.destroyed : true
        };
    }
}

// Export for use in other modules
window.WebRTCManagerPeerJS = WebRTCManagerPeerJS;
