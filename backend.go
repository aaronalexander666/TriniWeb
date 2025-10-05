package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

// AudioState represents the current state of the audio player
type AudioState struct {
	IsPlaying  bool    `json:"isPlaying"`
	Volume     float64 `json:"volume"`
	IsMuted    bool    `json:"isMuted"`
	CurrentTime int   `json:"currentTime"`
	Duration   int     `json:"duration"`
}

// WebSocket message structure
type WebSocketMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Global state
var (
	audioStateMu sync.RWMutex
	audioState   = AudioState{
		IsPlaying:   false,
		Volume:      0.7,
		IsMuted:     false,
		CurrentTime: 0,
		Duration:    180, // 3 minutes in seconds
	}
	clients = make(map[*websocket.Conn]bool)
	broadcast = make(chan AudioState)
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in development
		},
	}
)

func init() {
	// Load environment variables
	godotenv.Load()
}

func main() {
	// Start the audio timer
	go startAudioTimer()

	// Start WebSocket broadcaster
	go broadcastAudioState()

	// Define routes
	http.HandleFunc("/api/state", handleState)
	http.HandleFunc("/api/control", handleControl)
	http.HandleFunc("/ws", handleWebSocket)

	// Serve static files (your React app)
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// startAudioTimer runs the audio timer in the background
func startAudioTimer() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		audioStateMu.Lock()
		if audioState.IsPlaying {
			audioState.CurrentTime++
			if audioState.CurrentTime >= audioState.Duration {
				audioState.IsPlaying = false
				audioState.CurrentTime = 0
			}
		}
		currentState := audioState
		audioStateMu.Unlock()
		broadcast <- currentState
	}
}

// broadcastAudioState sends the current state to all connected clients
func broadcastAudioState() {
	for state := range broadcast {
		for client := range clients {
			err := client.WriteJSON(state)
			if err != nil {
				log.Printf("Error writing to client: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// handleState returns the current audio state
func handleState(w http.ResponseWriter, r *http.Request) {
	audioStateMu.RLock()
	defer audioStateMu.RUnlock()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(audioState)
}

// handleControl handles audio control commands
func handleControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var cmd struct {
		Action string  `json:"action"`
		Value  float64 `json:"value"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	audioStateMu.Lock()
	defer audioStateMu.Unlock()

	switch cmd.Action {
	case "play":
		audioState.IsPlaying = true
	case "pause":
		audioState.IsPlaying = false
	case "togglePlay":
		audioState.IsPlaying = !audioState.IsPlaying
	case "setVolume":
		audioState.Volume = cmd.Value
		audioState.IsMuted = cmd.Value == 0
	case "toggleMute":
		audioState.IsMuted = !audioState.IsMuted
		if audioState.IsMuted {
			audioState.Volume = 0
		} else {
			audioState.Volume = 0.7 // default volume when unmuting
		case "reset":
			audioState.IsPlaying = false
			audioState.CurrentTime = 0
		}
	}

	// Broadcast new state
	broadcast <- audioState

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(audioState)
}

// handleWebSocket handles WebSocket connections
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Add client to the list
	clients[conn] = true

	// Send current state to new client
	audioStateMu.RLock()
	currentState := audioState
	audioStateMu.RUnlock()
	conn.WriteJSON(currentState)

	// Handle incoming messages
	for {
		var msg WebSocketMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			delete(clients, conn)
			break
		}

		audioStateMu.Lock()
		switch msg.Type {
		case "play":
			audioState.IsPlaying = true
		case "pause":
			audioState.IsPlaying = false
		case "togglePlay":
			audioState.IsPlaying = !audioState.IsPlaying
		case "setVolume":
			if volume, ok := msg.Data.(float64); ok {
				audioState.Volume = volume
				audioState.IsMuted = volume == 0
			}
		case "toggleMute":
			audioState.IsMuted = !audioState.IsMuted
			if audioState.IsMuted {
				audioState.Volume = 0
			} else {
				audioState.Volume = 0.7
			}
		case "reset":
			audioState.IsPlaying = false
			audioState.CurrentTime = 0
		case "setPosition":
			if pos, ok := msg.Data.(float64); ok {
				audioState.CurrentTime = int(pos)
			}
		}
		currentState := audioState
		audioStateMu.Unlock()

		// Broadcast new state
		broadcast <- currentState
	}
}

// Helper function to format time as MM:SS
func formatTime(seconds int) string {
	minutes := seconds / 60
	secs := seconds % 60
	return fmt.Sprintf("%02d:%02d", minutes, secs)
}