import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('✅ Socket connected');
    });
    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  s.emit('join', userId);
  console.log('Socket joined room:', userId);
}
