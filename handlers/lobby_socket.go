package handlers

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var lobbyUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type LobbyClient struct {
	Conn     *websocket.Conn
	UserID   string
	TeamID   string
	UserName string
	ImageURL string
	IsReady  bool
	mu       sync.Mutex
}

func (c *LobbyClient) SendJSON(v interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.Conn.WriteJSON(v)
}

type LobbyRoom struct {
	Clients map[string]*LobbyClient
	mu      sync.RWMutex
}

type LobbyHub struct {
	Rooms map[string]*LobbyRoom
	mu    sync.RWMutex
}

var Hub = &LobbyHub{
	Rooms: make(map[string]*LobbyRoom),
}

func (h *LobbyHub) GetOrCreateRoom(contestID string) *LobbyRoom {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.Rooms[contestID]
	if !exists {
		room = &LobbyRoom{
			Clients: make(map[string]*LobbyClient),
		}
		h.Rooms[contestID] = room
	}
	return room
}

func (h *LobbyHub) BroadcastState(contestID string) {
	h.mu.RLock()
	room, exists := h.Rooms[contestID]
	h.mu.RUnlock()

	if !exists {
		return
	}

	room.mu.RLock()
	var playersData []map[string]interface{}
	readyCount := 0

	for _, client := range room.Clients {
		playersData = append(playersData, map[string]interface{}{
			"user_id":   client.UserID,
			"team_id":   client.TeamID,
			"user_name": client.UserName,
			"image_url": client.ImageURL,
			"is_ready":  client.IsReady,
		})
		if client.IsReady {
			readyCount++
		}
	}
	room.mu.RUnlock()

	payload := map[string]interface{}{
		"event":       "LOBBY_UPDATE",
		"players":     playersData,
		"ready_count": readyCount,
	}

	room.mu.RLock()
	for _, client := range room.Clients {
		err := client.SendJSON(payload)
		if err != nil {
			log.Printf("Error sending to client %s: %v", client.UserID, err)
		}
	}
	room.mu.RUnlock()
}

func (h *Handler) ConnectLobbySocket(c *gin.Context) {
	contestID := c.Param("id")
	userID := c.Query("user_id")
	teamID := c.Query("team_id")
	userName := c.Query("user_name")
	imageURL := c.Query("image_url")

	if userID == "" || teamID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and team_id are required"})
		return
	}

	conn, err := lobbyUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket Upgrade Error:", err)
		return
	}

	client := &LobbyClient{
		Conn:     conn,
		UserID:   userID,
		TeamID:   teamID,
		UserName: userName,
		ImageURL: imageURL,
		IsReady:  false,
	}

	room := Hub.GetOrCreateRoom(contestID)
	room.mu.Lock()
	room.Clients[userID] = client
	room.mu.Unlock()

	log.Printf("[LOBBY] User %s joined contest %s", userID, contestID)

	Hub.BroadcastState(contestID)

	defer func() {
		room.mu.Lock()
		delete(room.Clients, userID)
		room.mu.Unlock()
		conn.Close()
		log.Printf("[LOBBY] User %s left contest %s", userID, contestID)

		Hub.BroadcastState(contestID)
	}()

	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		event, ok := msg["event"].(string)
		if !ok {
			continue
		}

		if event == "PLAYER_READY" {
			room.mu.Lock()
			if c, exists := room.Clients[userID]; exists {
				c.IsReady = true
			}
			room.mu.Unlock()

			log.Printf("[LOBBY] User %s is READY in contest %s", userID, contestID)

			Hub.BroadcastState(contestID)

		} else if event == "HOST_START_MATCH" {
			log.Printf("[LOBBY] Host initiated MATCH_START for %s", contestID)

			startPayload := map[string]interface{}{
				"event": "MATCH_START",
			}

			room.mu.RLock()
			for _, client := range room.Clients {
				_ = client.SendJSON(startPayload)
			}
			room.mu.RUnlock()
		}
	}
}
