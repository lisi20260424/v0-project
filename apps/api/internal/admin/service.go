package admin

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Model struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Provider    string         `json:"provider"`
	ModelType   string         `json:"model_type"`
	BillingType string         `json:"billing_type"`
	CostPerUse  int            `json:"cost_per_use"`
	Description string         `json:"description"`
	Config      map[string]any `json:"config"`
	Enabled     bool           `json:"enabled"`
	SortOrder   int            `json:"sort_order"`
	CreatedAt   string         `json:"created_at"`
	UpdatedAt   string         `json:"updated_at"`
}

type Provider struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	DisplayName string         `json:"display_name"`
	Description string         `json:"description"`
	Config      map[string]any `json:"config"`
	Enabled     bool           `json:"enabled"`
	SortOrder   int            `json:"sort_order"`
	CreatedAt   string         `json:"created_at"`
	UpdatedAt   string         `json:"updated_at"`
}

type Prompt struct {
	ID        string `json:"id"`
	ModelType string `json:"model_type"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	Enabled   bool   `json:"enabled"`
	SortOrder int    `json:"sort_order"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type User struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	DisplayName  string `json:"display_name"`
	AvatarURL    string `json:"avatar_url"`
	Points       int    `json:"points"`
	UserType     string `json:"user_type"`
	Status       string `json:"status"`
	VipTier      string `json:"vip_tier"`
	VipExpiresAt string `json:"vip_expires_at"`
	CreatedAt    string `json:"created_at"`
	LastSignInAt string `json:"last_sign_in_at"`
}

type SystemSettings struct {
	GatewayURL string `json:"gatewayUrl"`
	UpdatedAt  string `json:"updatedAt"`
}

type Service struct {
	mu        sync.RWMutex
	models    []Model
	providers []Provider
	prompts   []Prompt
	users     []User
	settings  SystemSettings
}

func NewService() *Service {
	now := time.Now().UTC().Format(time.RFC3339)
	return &Service{
		models:    []Model{},
		providers: []Provider{},
		prompts:   []Prompt{},
		users: []User{{
			ID: "u_admin", Email: "admin@example.com", DisplayName: "Admin", AvatarURL: "", Points: 1000,
			UserType: "admin", Status: "active", VipTier: "lifetime", VipExpiresAt: "", CreatedAt: now, LastSignInAt: now,
		}},
		settings: SystemSettings{GatewayURL: "", UpdatedAt: now},
	}
}

func (s *Service) ListModels(_ context.Context) []Model {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Model{}, s.models...)
}
func (s *Service) CreateModel(_ context.Context, m Model) (Model, error) {
	if m.Name == "" || m.Provider == "" || m.ModelType == "" {
		return Model{}, fmt.Errorf("invalid params")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	s.mu.Lock()
	defer s.mu.Unlock()
	m.ID = fmt.Sprintf("mdl_%d", time.Now().UnixNano())
	m.BillingType = "per_use"
	m.CreatedAt, m.UpdatedAt = now, now
	s.models = append(s.models, m)
	return m, nil
}
func (s *Service) UpdateModel(_ context.Context, id string, patch map[string]any) (Model, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.models {
		if s.models[i].ID != id {
			continue
		}
		if v, ok := patch["name"].(string); ok && v != "" {
			s.models[i].Name = v
		}
		if v, ok := patch["provider"].(string); ok && v != "" {
			s.models[i].Provider = v
		}
		if v, ok := patch["modelType"].(string); ok && v != "" {
			s.models[i].ModelType = v
		}
		if v, ok := patch["enabled"].(bool); ok {
			s.models[i].Enabled = v
		}
		if v, ok := patch["description"].(string); ok {
			s.models[i].Description = v
		}
		s.models[i].UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		return s.models[i], nil
	}
	return Model{}, fmt.Errorf("model not found")
}
func (s *Service) DeleteModel(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.models {
		if s.models[i].ID == id {
			s.models = append(s.models[:i], s.models[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("model not found")
}

func (s *Service) ListProviders(_ context.Context) []Provider {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Provider{}, s.providers...)
}
func (s *Service) CreateProvider(_ context.Context, p Provider) (Provider, error) {
	if p.Name == "" {
		return Provider{}, fmt.Errorf("invalid params")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = fmt.Sprintf("prv_%d", time.Now().UnixNano())
	p.CreatedAt, p.UpdatedAt = now, now
	if p.DisplayName == "" {
		p.DisplayName = p.Name
	}
	s.providers = append(s.providers, p)
	return p, nil
}
func (s *Service) UpdateProvider(_ context.Context, id string, patch map[string]any) (Provider, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.providers {
		if s.providers[i].ID != id {
			continue
		}
		if v, ok := patch["name"].(string); ok && v != "" {
			s.providers[i].Name = v
		}
		if v, ok := patch["displayName"].(string); ok {
			s.providers[i].DisplayName = v
		}
		if v, ok := patch["enabled"].(bool); ok {
			s.providers[i].Enabled = v
		}
		s.providers[i].UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		return s.providers[i], nil
	}
	return Provider{}, fmt.Errorf("provider not found")
}
func (s *Service) DeleteProvider(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.providers {
		if s.providers[i].ID == id {
			s.providers = append(s.providers[:i], s.providers[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("provider not found")
}

func (s *Service) ListPrompts(_ context.Context) []Prompt {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Prompt{}, s.prompts...)
}
func (s *Service) CreatePrompt(_ context.Context, p Prompt) (Prompt, error) {
	if p.Title == "" || p.Content == "" {
		return Prompt{}, fmt.Errorf("invalid params")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = fmt.Sprintf("prm_%d", time.Now().UnixNano())
	p.CreatedAt, p.UpdatedAt = now, now
	s.prompts = append(s.prompts, p)
	return p, nil
}
func (s *Service) UpdatePrompt(_ context.Context, id string, patch map[string]any) (Prompt, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.prompts {
		if s.prompts[i].ID != id {
			continue
		}
		if v, ok := patch["title"].(string); ok && v != "" {
			s.prompts[i].Title = v
		}
		if v, ok := patch["content"].(string); ok && v != "" {
			s.prompts[i].Content = v
		}
		if v, ok := patch["enabled"].(bool); ok {
			s.prompts[i].Enabled = v
		}
		s.prompts[i].UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		return s.prompts[i], nil
	}
	return Prompt{}, fmt.Errorf("prompt not found")
}
func (s *Service) DeletePrompt(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.prompts {
		if s.prompts[i].ID == id {
			s.prompts = append(s.prompts[:i], s.prompts[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("prompt not found")
}

func (s *Service) ListUsers(_ context.Context) []User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]User{}, s.users...)
}
func (s *Service) UpdateUser(_ context.Context, id string, patch map[string]any) (User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.users {
		if s.users[i].ID != id {
			continue
		}
		if v, ok := patch["displayName"].(string); ok {
			s.users[i].DisplayName = v
		}
		if v, ok := patch["avatarUrl"].(string); ok {
			s.users[i].AvatarURL = v
		}
		if v, ok := patch["userType"].(string); ok {
			s.users[i].UserType = v
		}
		if v, ok := patch["status"].(string); ok {
			s.users[i].Status = v
		}
		if v, ok := patch["vipTier"].(string); ok {
			s.users[i].VipTier = v
		}
		if v, ok := patch["points"].(float64); ok {
			s.users[i].Points = int(v)
		}
		if v, ok := patch["vipExpiresAt"].(string); ok {
			s.users[i].VipExpiresAt = v
		}
		return s.users[i], nil
	}
	return User{}, fmt.Errorf("user not found")
}

func (s *Service) GetSettings(_ context.Context) SystemSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}
func (s *Service) UpdateSettings(_ context.Context, in SystemSettings) SystemSettings {
	s.mu.Lock()
	defer s.mu.Unlock()
	if in.GatewayURL != "" {
		s.settings.GatewayURL = in.GatewayURL
	}
	s.settings.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	return s.settings
}
