// export class ScriptMonitorWebSocket {
//     private ws: WebSocket | null = null;
  
//     connect() {
//       this.ws = new WebSocket('ws://your-websocket-server:8010');
      
//       this.ws.onopen = () => {
//         console.log('WebSocket Connected');
//       };
  
//       this.ws.onmessage = (event) => {
//         // Handle incoming messages
//         console.log('Received:', event.data);
//       };
//     }
  
//     sendMessage(message: string) {
//       if (this.ws && this.ws.readyState === WebSocket.OPEN) {
//         this.ws.send(message);
//       }
//     }
  
//     close() {
//       if (this.ws) {
//         this.ws.close();
//       }
//     }
//   }