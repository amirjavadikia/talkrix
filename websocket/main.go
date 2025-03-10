package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"golang.org/x/net/context"
)

// Client represents a connected websocket client
type Client struct {
	ID             string
	Type           string // "visitor" or "agent"
	WebsiteID      string
	ConversationID string
	Conn           *websocket.Conn
	Send           chan []byte
	Hub            *Hub
}

// Message struct for websocket messages
type Message struct {
	Type           string      `json:"type"`
	WebsiteID      string      `json:"website_id"`
	ConversationID string      `json:"conversation_id"`
	SenderType     string      `json:"sender_type"`
	SenderID       string      `json:"sender_id"`
	Content        interface{} `json:"content"`
	Timestamp      int64       `json:"timestamp"`
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast message to all clients
	broadcast chan []byte

	// Mutex for thread-safe operations
	mutex sync.Mutex
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for now, in production restrict this
		},
	}

	// Redis client for pub/sub
	redisClient *redis.Client
)

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		mutex:      sync.Mutex{},
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client connected: %s (type: %s)", client.ID, client.Type)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				log.Printf("Client disconnected: %s", client.ID)
			}
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.Lock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mutex.Unlock()
		}
	}
}

// Handle incoming messages from a client
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512000) // Max message size 500KB
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Parse and route the message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		// Add timestamp if not provided
		if msg.Timestamp == 0 {
			msg.Timestamp = time.Now().Unix()
		}

		// Process different message types
		switch msg.Type {
		case "chat":
			// Save message to Redis for persistence
			saveMessageToRedis(msg)
			// Broadcast to appropriate clients
			routeMessage(c.Hub, msg)
		case "typing":
			// Just route the typing indicator, no need to persist
			routeMessage(c.Hub, msg)
		case "read":
			// Mark messages as read in the database
			markMessagesAsRead(msg)
			// Route the read receipt
			routeMessage(c.Hub, msg)
		}
	}
}

// Send messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// The hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Route message to appropriate clients based on conversation ID
func routeMessage(h *Hub, msg Message) {
	msgBytes, _ := json.Marshal(msg)

	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Route to specific clients based on conversation ID
	for client := range h.clients {
		// Route to agents for this website
		if client.Type == "agent" && client.WebsiteID == msg.WebsiteID {
			client.Send <- msgBytes
		}

		// Route to visitors in this conversation
		if client.Type == "visitor" && client.ConversationID == msg.ConversationID {
			client.Send <- msgBytes
		}
	}
}

// Save message to Redis
func saveMessageToRedis(msg Message) {
	ctx := context.Background()
	msgBytes, _ := json.Marshal(msg)

	// Publish to Redis channel for Laravel to consume and save to database
	err := redisClient.Publish(ctx, "chat_messages", msgBytes).Err()
	if err != nil {
		log.Printf("Error publishing message to Redis: %v", err)
	}
}

// Mark messages as read in the database via Redis
func markMessagesAsRead(msg Message) {
	ctx := context.Background()
	readMsg := map[string]interface{}{
		"type":            "read",
		"conversation_id": msg.ConversationID,
		"sender_type":     msg.SenderType,
		"sender_id":       msg.SenderID,
	}

	readMsgBytes, _ := json.Marshal(readMsg)

	// Publish to Redis channel for Laravel to process
	err := redisClient.Publish(ctx, "message_read", readMsgBytes).Err()
	if err != nil {
		log.Printf("Error publishing read receipt to Redis: %v", err)
	}
}

// WebSocket handler for visitors
func serveVisitorWs(hub *Hub, c *gin.Context) {
	websiteID := c.Query("website_id")
	visitorID := c.Query("visitor_id")
	conversationID := c.Query("conversation_id")

	if websiteID == "" || visitorID == "" || conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		ID:             visitorID,
		Type:           "visitor",
		WebsiteID:      websiteID,
		ConversationID: conversationID,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		Hub:            hub,
	}

	client.Hub.register <- client

	// Send connection confirmation
	connMsg := Message{
		Type:           "system",
		WebsiteID:      websiteID,
		ConversationID: conversationID,
		SenderType:     "system",
		SenderID:       "0",
		Content:        "Connected to chat server",
		Timestamp:      time.Now().Unix(),
	}

	connMsgBytes, _ := json.Marshal(connMsg)
	client.Send <- connMsgBytes

	// Start goroutines to handle read/write
	go client.readPump()
	go client.writePump()
}

// WebSocket handler for agents
func serveAgentWs(hub *Hub, c *gin.Context) {
	agentID := c.Query("agent_id")
	websiteID := c.Query("website_id")

	if agentID == "" || websiteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		ID:        agentID,
		Type:      "agent",
		WebsiteID: websiteID,
		Conn:      conn,
		Send:      make(chan []byte, 256),
		Hub:       hub,
	}

	client.Hub.register <- client

	// Send connection confirmation
	connMsg := Message{
		Type:       "system",
		WebsiteID:  websiteID,
		SenderType: "system",
		SenderID:   "0",
		Content:    "Connected to chat server",
		Timestamp:  time.Now().Unix(),
	}

	connMsgBytes, _ := json.Marshal(connMsg)
	client.Send <- connMsgBytes

	// Start goroutines to handle read/write
	go client.readPump()
	go client.writePump()
}

// Health check endpoint
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Chat server is running",
		"time":    time.Now().Unix(),
	})
}

func main() {
	// Initialize Redis client
	redisClient = redis.NewClient(&redis.Options{
		Addr:     "redis:6379", // Use environment variables in production
		Password: "",           // No password set
		DB:       0,            // Use default DB
	})

	// Create a new hub
	hub := newHub()
	go hub.run()

	// Create Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowCredentials = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Routes
	router.GET("/health", healthCheck)
	router.GET("/ws/visitor", func(c *gin.Context) {
		serveVisitorWs(hub, c)
	})
	router.GET("/ws/agent", func(c *gin.Context) {
		serveAgentWs(hub, c)
	})

	// Subscribe to Redis for messages from Laravel
	ctx := context.Background()
	pubsub := redisClient.Subscribe(ctx, "agent_messages")
	go func() {
		for {
			msg, err := pubsub.ReceiveMessage(ctx)
			if err != nil {
				log.Printf("Error receiving message from Redis: %v", err)
				continue
			}

			var message Message
			if err := json.Unmarshal([]byte(msg.Payload), &message); err != nil {
				log.Printf("Error parsing message from Redis: %v", err)
				continue
			}

			// Route the message from Redis to WebSocket clients
			routeMessage(hub, message)
		}
	}()

	// Start the server
	port := ":8080" // Use environment variables in production
	log.Printf("Starting WebSocket server on %s", port)
	router.Run(port)
}
