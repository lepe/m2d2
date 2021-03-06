m2d2.load($ => {
    //------------------------ WS --------------------------------
    /**
     * @author: A.Lepe
     * @version: 210425 : Added secure, host and converted to m2d2 extension
     *           210406 : Retry until reconnect
     * @since : 2018
     * WebSocket wrapper
     *
     * Usage:
     const wsc = new ws({
        request      : { ... }, // Initial Request (optional)
        connect      : () => {}, // Function to execute when it successfully connects
        disconnected : () => {}, // Function to execute when it gets disconnected
        reconnect    : true, // Try to reconnect if it gets disconnected (default: true)
        secure       : false, // If true, will use wss
        host         : "localhost", // Server name
        path         : "", // WebSocket's URL path, for example: ws://server/<path> (default: "")
        port         : 80, // Port in which the WebSocket server is listening (default: 80, 443)
   });
     wsc.connect(response => {
        // response is the object which the server is sending.
   });
     wsc.request({ ... }); // To request something to the server, send it as object.
     wsc.disconnect(); // Disconnect from server (it will turn off reconnection)
     *
     *
     */
    class ws {
        request(msg) {
            if (msg) {
                try {
                    this.webSocket.send(JSON.stringify(msg));
                } catch(e) {
                    this.webSocket.onerror(e);
                }
            }
        }
        /**
         * Connect and return the websocket object
         */
        getSocket(onMessage, onOpen, onClose) {
            const webSocket = new WebSocket(this.path);
            webSocket.onopen = onOpen;
            webSocket.onclose = onClose;
            webSocket.onmessage = (res) => {
                if (res.data) {
                    try {
                        onMessage(JSON.parse(res.data));
                    } catch(e) {
                        webSocket.onerror(e);
                    }
                }
            }
            webSocket.onerror = (err) => {
                console.error('Socket encountered error: ', err ? err.message : 'Unknown', 'Closing socket');
                const wsk = webSocket || this;
                if(wsk.readyState === 1) {
                    wsk.close();
                }
            }
            return webSocket;
        }
        connect(options, onMessage) {
            this.initRequest = options.request || null;
            this.onConnect = options.connected || (() => {});
            this.onDisconnect = options.disconnected || (() => {});
            this.reconnect = options.reconnect !== false;
            this.host = options.host || window.location.hostname;
            this.secure = options.secure === true;
            this.port = options.port || (this.secure ? 443 : 80);
            this.path = "ws" + (this.secure ? "s" : "") + "://" + this.host + ":" + this.port + "/" + (options.path || "");
            this.connected = false;
            this.interval = null;
            //-------- Connect ----------
            const onOpen = (e) => {
                this.connected = true;
                this.request(this.initRequest);
                this.onConnect();
            }
            const onClose = (e) => {
                this.connected = false;
                this.onDisconnect();
                if(!this.interval && this.reconnect) {
                    this.interval = setInterval(() => {
                        if(this.connected) {
                            console.log("Reconnected...")
                            clearInterval(this.interval);
                            this.interval = null;
                        } else {
                            try {
                                this.webSocket.close();
                                console.log("Reconnecting...")
                                this.webSocket = this.getSocket(onMessage, onOpen, onClose);
                            } catch(ignore) {}
                        }
                    }, 2000);
                }
            }
            this.webSocket = this.getSocket(onMessage, onOpen, onClose);
        }
        disconnect() {
            this.reconnect = false;
            this.webSocket.close();
        }
    }
    $.ws = new ws();
});