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
        // For local development, use fallback signaling directly
        console.log('Setting up local signaling for Quran app');
        this.setupFallbackSignaling();
    }
    
    setupFallbackSignaling() {
        // Fallback: Use localStorage + polling for local testing
        this.signalingServer = {
            send: (data) => {
                const key = 'quran_signaling_' + this.roomId;
                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                messages.push(JSON.parse(data));
                localStorage.setItem(key, JSON.stringify(messages));
            },
            close: () => {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                }
            },
            readyState: 1 // OPEN
        };
        
        // Start polling for messages
        this.startLocalPolling();
        
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
            
            // Process new messages
            for (let i = this.lastMessageIndex; i < messages.length; i++) {
                const message = messages[i];
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
        
        // Clear any existing signaling data for this room
        localStorage.removeItem('quran_signaling_' + this.roomId);
        
        this.localUser = {
            id: this.generateUserId(),
            name: userName,
            role: 'controller',
            isHost: true
        };
        
        // Start polling for local signaling if using fallback
        if (this.signalingServer && this.signalingServer.send) {
            this.startLocalPolling();
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
        
        // Send join request to find host
        this.sendSignalingMessage({
            type: 'join-request',
            userData: this.localUser,
            from: this.localUser.id,
            roomId: roomId
        });
        
        this.updateConnectionStatus('Joining Room: ' + roomId);
        
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange('Joining', roomId);
        }
    }
    
    async createPeerConnection(peerId) {
        const pc = new RTCPeerConnection(this.rtcConfig);
        
        // Create data channel for Quran data
        const dataChannel = pc.createDataChannel('quranData', {
            ordered: false, // Allow out-of-order delivery for better performance
            maxRetransmits: 0 // Don't retransmit old data
        });
        
        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
            this.updateConnectionStatus('Connected');
        };
        
        dataChannel.onmessage = (event) => {
            this.handleQuranMessage(JSON.parse(event.data), peerId);
        };
        
        dataChannel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.handleUserDisconnect(peerId);
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
            };
            
            channel.onmessage = (event) => {
                this.handleQuranMessage(JSON.parse(event.data), peerId);
            };
            
            channel.onclose = () => {
                console.log(`Incoming data channel closed with ${peerId}`);
                this.handleUserDisconnect(peerId);
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
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.handleUserDisconnect(peerId);
            }
        };
        
        this.connections.set(peerId, { pc, dataChannel });
        
        // Create offer if we're the host (initiator)
        if (this.isHost) {
            console.log('Host creating offer for:', peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.sendSignalingMessage({
                type: 'offer',
                offer: offer,
                target: peerId,
                from: this.localUser.id
            });
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
                    }
                    break;
                    
                case 'offer':
                    if (!message.target || message.target !== this.localUser?.id) return;
                    
                    let connection = this.connections.get(peerId);
                    if (!connection) {
                        await this.createPeerConnection(peerId);
                        connection = this.connections.get(peerId);
                    }
                    
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
                    break;
                    
                case 'answer':
                    if (!message.target || message.target !== this.localUser?.id) return;
                    
                    const answerConnection = this.connections.get(peerId);
                    if (answerConnection) {
                        await answerConnection.pc.setRemoteDescription(message.answer);
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
    
    sendSignalingMessage(message) {
        if (this.signalingServer && this.signalingServer.readyState === 1) {
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
}

// Export for use in other modules
window.WebRTCManager = WebRTCManager;
