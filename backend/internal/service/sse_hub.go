package service

import (
	"encoding/json"
	"fmt"
	"sync"
)

// SSEHub manages per-user SSE subscriptions
type SSEHub struct {
	mu      sync.RWMutex
	clients map[string][]chan string // userID → list of channels
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients: make(map[string][]chan string),
	}
}

// Subscribe creates a new channel for a user and returns it along with a cleanup func
func (h *SSEHub) Subscribe(userID string) (chan string, func()) {
	ch := make(chan string, 16)
	h.mu.Lock()
	h.clients[userID] = append(h.clients[userID], ch)
	h.mu.Unlock()

	unsubscribe := func() {
		h.mu.Lock()
		defer h.mu.Unlock()
		channels := h.clients[userID]
		for i, c := range channels {
			if c == ch {
				h.clients[userID] = append(channels[:i], channels[i+1:]...)
				break
			}
		}
		if len(h.clients[userID]) == 0 {
			delete(h.clients, userID)
		}
		close(ch)
	}
	return ch, unsubscribe
}

// Broadcast sends an event to all connections for a given user
func (h *SSEHub) Broadcast(userID string, event SSEEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		return
	}
	msg := fmt.Sprintf("data: %s\n\n", data)

	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, ch := range h.clients[userID] {
		select {
		case ch <- msg:
		default: // drop if buffer full
		}
	}
}
