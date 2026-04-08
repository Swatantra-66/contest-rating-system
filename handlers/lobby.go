package handlers

import (
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type Room struct {
	ID        string
	CreatedAt time.Time
}

type RoomManager struct {
	sync.RWMutex
	Rooms map[string]*Room
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		Rooms: make(map[string]*Room),
	}
}

func generateRoomCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 5)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func (m *RoomManager) HandleCreateRoom(c *gin.Context) {
	m.Lock()
	defer m.Unlock()

	var code string
	for {
		code = generateRoomCode()
		if _, exists := m.Rooms[code]; !exists {
			break
		}
	}

	m.Rooms[code] = &Room{
		ID:        code,
		CreatedAt: time.Now(),
	}

	c.JSON(http.StatusOK, gin.H{
		"room_code": code,
	})
}

type JoinRequest struct {
	RoomCode string `json:"room_code" binding:"required,len=5"`
}

func (m *RoomManager) HandleJoinRoom(c *gin.Context) {
	var req JoinRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room code format"})
		return
	}

	m.RLock()
	_, exists := m.Rooms[req.RoomCode]
	m.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found or expired"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
