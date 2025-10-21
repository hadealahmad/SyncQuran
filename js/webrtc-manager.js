/**
 * WebRTC Manager for Quran Synchronization
 * Adapted from the multiplayer game for Quran-specific functionality
 */
class WebRTCManager {
    constructor() {
        this.localUser = null;
        this.remoteUsers = new Map();
        this.connections = new Map();
        this.isHost = false;
        this.roomId = null;
        this.signalingServer = null;
        
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
        
        this.setupSignalingServer();
    }
    
    setupSignalingServer() {
        // Try WebSocket signaling first, fallback to localStorage
        const signalingUrl = this.getSignalingUrl();
        
        if (signalingUrl) {
            console.log('Setting up WebSocket signaling:', signalingUrl);
            this.setupWebSocketSignaling(signalingUrl);
        } else {
            console.log('Setting up local signaling for Quran app');
            this.setupFallbackSignaling();
        }
    }
    
    getSignalingUrl() {
        // Check for environment-specific signaling server
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'ws://localhost:8081/signaling';
        }
        
        // For production, you would use a real signaling server
        // return 'wss://your-signaling-server.com/signaling';
        
        return null; // Use fallback
    }
    
    setupWebSocketSignaling(url) {
        try {
            this.signalingServer = new WebSocket(url);
            
            this.signalingServer.onopen = () => {
                console.log('WebSocket signaling connected');
                this.updateConnectionStatus('Signaling Connected');
            };
            
            this.signalingServer.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.signalingServer.onclose = () => {
                console.log('WebSocket signaling disconnected');
                this.updateConnectionStatus('Signaling Disconnected');
                
                // Try to reconnect after 3 seconds
                setTimeout(() => {
                    if (!this.signalingServer || this.signalingServer.readyState === WebSocket.CLOSED) {
                        console.log('Attempting to reconnect...');
                        this.setupWebSocketSignaling(url);
                    }
                }, 3000);
            };
            
            this.signalingServer.onerror = (error) => {
                console.error('WebSocket signaling error:', error);
                this.updateConnectionStatus('Signaling Error');
                
                // Fallback to localStorage if WebSocket fails
                console.log('Falling back to localStorage signaling');
                this.setupFallbackSignaling();
            };
            
        } catch (error) {
            console.error('Failed to setup WebSocket signaling:', error);
            console.log('Falling back to localStorage signaling');
            this.setupFallbackSignaling();
        }
    }
    
    handleWebSocketMessage(message) {
        console.log('Received WebSocket message:', message.type);
        
        switch (message.type) {
            case 'room-joined':
                console.log('Successfully joined room:', message.roomId);
                this.updateConnectionStatus('Room Joined: ' + message.roomId);
                break;
                
            case 'user-joined':
                console.log('User joined:', message.userId);
                
                // If we're the host, create a peer connection with the new user
                if (this.isHost && message.userId !== this.localUser?.id) {
                    console.log('Host creating peer connection for new user:', message.userId);
                    this.createPeerConnection(message.userId);
                }
                
                if (this.callbacks.onUserJoin) {
                    this.callbacks.onUserJoin(message.userData);
                }
                break;
                
            case 'user-left':
                console.log('User left:', message.userId);
                if (this.callbacks.onUserLeave) {
                    this.callbacks.onUserLeave({ id: message.userId });
                }
                break;
                
            case 'user-update':
                console.log('User updated:', message.userId);
                if (this.callbacks.onUserUpdate) {
                    this.callbacks.onUserUpdate(message.userData);
                }
                break;
                
            case 'offer':
            case 'answer':
            case 'ice-candidate':
                // Handle WebRTC signaling messages
                console.log('Processing WebRTC message:', message.type, 'from:', message.from);
                this.handleSignalingMessage(message);
                break;
        }
    }
    
    setupFallbackSignaling() {
        // Fallback: Use localStorage + polling for local testing
        this.signalingServer = {
            send: (data) => {
                const key = 'quran_signaling_' + this.roomId;
                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                const messageData = JSON.parse(data);
                messages.push(messageData);
                localStorage.setItem(key, JSON.stringify(messages));
                console.log('Sent signaling message:', messageData.type, 'to key:', key);
            },
            close: () => {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                }
            },
            readyState: 1 // OPEN
        };
        
        this.updateConnectionStatus('Local Mode');
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
            
            if (messages.length > this.lastMessageIndex) {
                console.log(`Found ${messages.length - this.lastMessageIndex} new messages in ${key}`);
            }
            
            // Process new messages
            for (let i = this.lastMessageIndex; i < messages.length; i++) {
                const message = messages[i];
                console.log('Processing message:', message.type, 'from:', message.from, 'to:', message.target);
                
                // Don't process our own messages
                if (message.from !== this.localUser?.id) {
                    this.handleSignalingMessage(message);
                }
            }
            
            this.lastMessageIndex = messages.length;
        }, 100);
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    async createRoom(userName) {
        this.roomId = this.generateRoomId();
        this.isHost = true;
        
        this.localUser = {
            id: this.generateUserId(),
            name: userName,
            role: 'controller',
            isHost: true
        };
        
        // Clear any existing signaling data for this room (fallback only)
        if (this.signalingServer && this.signalingServer.send) {
            localStorage.removeItem('quran_signaling_' + this.roomId);
            this.startLocalPolling();
        }
        
        // Join room via WebSocket or fallback
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage({
                type: 'join-room',
                roomId: this.roomId,
                userId: this.localUser.id,
                isHost: true,
                userData: this.localUser
            });
        } else if (this.signalingServer && this.signalingServer.send) {
            // Fallback to localStorage
            this.sendSignalingMessage({
                type: 'user-join',
                userData: this.localUser,
                from: this.localUser.id
            });
        }
        
        this.updateConnectionStatus('Room Created: ' + this.roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Host', this.roomId);
        }
        
        console.log('Quran room created with ID:', this.roomId, 'User ID:', this.localUser.id);
        
        return this.roomId;
    }
    
    async joinRoom(roomId, userName) {
        this.roomId = roomId;
        this.isHost = false;
        
        this.localUser = {
            id: this.generateUserId(),
            name: userName,
            role: 'listener',
            isHost: false
        };
        
        console.log('Joining Quran room:', roomId, 'User ID:', this.localUser.id);
        
        // Start polling for local signaling if using fallback
        if (this.signalingServer && this.signalingServer.send) {
            this.startLocalPolling();
        }
        
        // Join room via WebSocket or fallback
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage({
                type: 'join-room',
                roomId: this.roomId,
                userId: this.localUser.id,
                isHost: false,
                userData: this.localUser
            });
        } else if (this.signalingServer && this.signalingServer.send) {
            // Fallback to localStorage
            this.sendSignalingMessage({
                type: 'join-request',
                userData: this.localUser,
                from: this.localUser.id,
                roomId: roomId
            });
            
            this.sendSignalingMessage({
                type: 'user-join',
                userData: this.localUser,
                from: this.localUser.id
            });
        }
        
        this.updateConnectionStatus('Joining Room: ' + roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Joining', roomId);
        }
    }
    
    async createPeerConnection(peerId) {
        console.log(`Creating peer connection with ${peerId}`);
        
        // Check if connection already exists
        if (this.connections.has(peerId)) {
            console.log(`Connection with ${peerId} already exists`);
            return this.connections.get(peerId).pc;
        }
        
        const pc = new RTCPeerConnection(this.rtcConfig);
        
        // Create data channel for Quran data
        const dataChannel = pc.createDataChannel('quranData', {
            ordered: true, // Ensure messages arrive in order for synchronization
            // Don't set maxRetransmits or maxPacketLifeTime for reliable delivery
        });
        
        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
            this.updateConnectionStatus('Connected');
            
            // Send initial user data
            this.broadcastUserUpdate();
        };
        
        dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleQuranMessage(data, peerId);
            } catch (error) {
                console.error('Error parsing message from', peerId, ':', error);
            }
        };
        
        dataChannel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.handleUserDisconnect(peerId);
        };
        
        dataChannel.onerror = (error) => {
            console.error(`Data channel error with ${peerId}:`, error);
        };
        
        // Handle incoming data channels
        pc.ondatachannel = (event) => {
            const channel = event.channel;
            console.log('Received data channel from:', peerId);
            
            // Update our connection with the received channel
            const connection = this.connections.get(peerId);
            if (connection) {
                connection.dataChannel = channel;
            }
            
            channel.onopen = () => {
                console.log(`Incoming data channel opened with ${peerId}`);
                this.updateConnectionStatus('Connected');
                
                // Send initial user data
                this.broadcastUserUpdate();
            };
            
            channel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleQuranMessage(data, peerId);
                } catch (error) {
                    console.error('Error parsing incoming message from', peerId, ':', error);
                }
            };
            
            channel.onclose = () => {
                console.log(`Incoming data channel closed with ${peerId}`);
                this.handleUserDisconnect(peerId);
            };
            
            channel.onerror = (error) => {
                console.error(`Incoming data channel error with ${peerId}:`, error);
            };
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    target: peerId,
                    from: this.localUser.id
                });
            }
        };
        
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                this.updateConnectionStatus('Connected');
                console.log(`Successfully connected to ${peerId}`);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.log(`Connection lost with ${peerId}:`, pc.connectionState);
                this.handleUserDisconnect(peerId);
            }
        };
        
        this.connections.set(peerId, { pc, dataChannel });
        
        // Create offer if we're the host (initiator)
        if (this.isHost) {
            console.log('Host creating offer for:', peerId);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                const offerMessage = {
                    type: 'offer',
                    offer: offer,
                    target: peerId,
                    from: this.localUser.id
                };
                
                console.log('Sending offer message:', offerMessage);
                this.sendSignalingMessage(offerMessage);
                console.log('Offer sent to:', peerId);
            } catch (error) {
                console.error('Error creating offer:', error);
            }
        }
        
        return pc;
    }
    
    async handleSignalingMessage(message) {
        console.log('Received signaling message:', message.type, 'from:', message.from);
        
        const peerId = message.from;
        
        try {
            switch (message.type) {
                case 'join-request':
                    // Only host should handle join requests
                    if (this.isHost && message.roomId === this.roomId) {
                        console.log('Host received join request from:', peerId);
                        await this.createPeerConnection(peerId);
                        
                        // Send user data to the new peer
                        this.sendSignalingMessage({
                            type: 'user-join',
                            userData: this.localUser,
                            target: peerId,
                            from: this.localUser.id
                        });
                    }
                    break;
                    
                case 'offer':
                    if (!message.target || message.target !== this.localUser?.id) return;
                    
                    console.log('Received offer from:', peerId);
                    let connection = this.connections.get(peerId);
                    if (!connection) {
                        await this.createPeerConnection(peerId);
                        connection = this.connections.get(peerId);
                    }
                    
                    try {
                        const pc = connection.pc;
                        await pc.setRemoteDescription(message.offer);
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        
                        this.sendSignalingMessage({
                            type: 'answer',
                            answer: answer,
                            target: peerId,
                            from: this.localUser.id
                        });
                        console.log('Answer sent to:', peerId);
                    } catch (error) {
                        console.error('Error handling offer:', error);
                    }
                    break;
                    
                case 'answer':
                    if (!message.target || message.target !== this.localUser?.id) return;
                    
                    console.log('Received answer from:', peerId);
                    const answerConnection = this.connections.get(peerId);
                    if (answerConnection) {
                        try {
                            await answerConnection.pc.setRemoteDescription(message.answer);
                            console.log('Answer processed for:', peerId);
                        } catch (error) {
                            console.error('Error processing answer:', error);
                        }
                    }
                    break;
                    
                case 'ice-candidate':
                    if (!message.target || message.target !== this.localUser?.id) return;
                    
                    const candidateConnection = this.connections.get(peerId);
                    if (candidateConnection) {
                        await candidateConnection.pc.addIceCandidate(message.candidate);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling signaling message:', error);
        }
    }
    
    sendWebSocketMessage(message) {
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.signalingServer.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not ready, message not sent:', message);
        }
    }
    
    sendSignalingMessage(message) {
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            // Use WebSocket for signaling
            this.sendWebSocketMessage(message);
        } else if (this.signalingServer && this.signalingServer.send) {
            // Fallback to localStorage
            this.signalingServer.send(JSON.stringify(message));
        }
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
            connection.pc.close();
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
        this.connections.forEach((connection, peerId) => {
            if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
                try {
                    connection.dataChannel.send(JSON.stringify(message));
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
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
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
        // Close all peer connections
        this.connections.forEach((connection) => {
            connection.pc.close();
        });
        this.connections.clear();
        
        // Close signaling connection
        if (this.signalingServer) {
            this.signalingServer.close();
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
            signalingData: this.getSignalingData()
        };
    }
    
    getSignalingData() {
        if (!this.roomId) return null;
        const key = 'quran_signaling_' + this.roomId;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        console.log(`Getting signaling data for key: ${key}, found ${data.length} messages`);
        return data;
    }
    
    // Test function to verify signaling
    testSignaling() {
        if (!this.roomId) {
            console.log('No room ID set');
            return;
        }
        
        const key = 'quran_signaling_' + this.roomId;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        console.log(`=== Signaling Test for ${key} ===`);
        console.log(`Room ID: ${this.roomId}`);
        console.log(`Key: ${key}`);
        console.log(`Messages: ${data.length}`);
        console.log(`Data:`, data);
        
        // Check if we can read other room keys
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('quran_signaling_'));
        console.log(`All signaling keys:`, allKeys);
        
        return { key, data, allKeys };
    }
}

// Export for use in other modules
window.WebRTCManager = WebRTCManager;
