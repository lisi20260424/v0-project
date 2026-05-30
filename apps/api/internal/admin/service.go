package admin

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var catalogPool *pgxpool.Pool

func InitDB(pool *pgxpool.Pool) {
	catalogPool = pool
}

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

type GatewaySettings struct {
	APIKey     string `json:"apiKey"`
	GatewayURL string `json:"gatewayUrl"`
	UpdatedAt  string `json:"updatedAt"`
}

type GenerationConfig struct {
	MusicTimeout int    `json:"musicTimeout"`
	ImageTimeout int    `json:"imageTimeout"`
	VideoTimeout int    `json:"videoTimeout"`
	UpdatedAt    string `json:"updatedAt"`
}

type Service struct {
	mu        sync.RWMutex
	pool      *pgxpool.Pool
	models    []Model
	providers []Provider
	prompts   []Prompt
	users     []User
	settings  SystemSettings
}

func NewService() *Service {
	now := time.Now().UTC().Format(time.RFC3339)
	return &Service{
		pool: catalogPool,
		models: []Model{
			{ID: "model_veo_video", Name: "Veo 3.1", Provider: "google", ModelType: "video", BillingType: "per_use", CostPerUse: 30, Description: "High-quality text-to-video and image-to-video generation.", Config: map[string]any{"is_default_display": true, "ratios": []string{"16:9", "9:16", "1:1"}, "durations": []string{"5", "10"}, "max_count": 2, "supports_image_to_video": true, "image_capability": "start_end_frames", "multi_image_max": 5, "supports_negative_prompt": false}, Enabled: true, SortOrder: 10, CreatedAt: now, UpdatedAt: now},
			{ID: "model_gpt_image", Name: "GPT-Image", Provider: "openai", ModelType: "image", BillingType: "per_use", CostPerUse: 4, Description: "General purpose image generation.", Config: map[string]any{"is_default_display": true, "ratios": []string{"1:1", "9:16", "16:9", "3:4", "4:3"}, "qualities": []string{"standard", "hd"}, "max_count": 4, "supports_negative_prompt": true, "supports_reference_image": false}, Enabled: true, SortOrder: 20, CreatedAt: now, UpdatedAt: now},
			{ID: "model_suno_music", Name: "Suno V5", Provider: "suno", ModelType: "music", BillingType: "per_use", CostPerUse: 8, Description: "Text-to-song generation with optional lyrics.", Config: map[string]any{"is_default_display": true, "genres": []string{"Pop", "Electronic", "Rock", "Folk", "Hip Hop"}, "moods": []string{"Happy", "Epic", "Calm", "Sad"}, "vocals": []string{"female", "male", "duet", "instrumental"}, "tracks_per_generation": 2}, Enabled: true, SortOrder: 30, CreatedAt: now, UpdatedAt: now},
		},
		providers: []Provider{
			{ID: "provider_google", Name: "google", DisplayName: "Google", Description: "Google AI models", Config: map[string]any{"ui_by_type": map[string]any{"video": map[string]any{"display_name": "Veo Video", "icon": "Video", "accent": "from-emerald-500/30 to-teal-500/10", "description": "Cinematic video generation.", "cost": "30 points"}}}, Enabled: true, SortOrder: 10, CreatedAt: now, UpdatedAt: now},
			{ID: "provider_openai", Name: "openai", DisplayName: "OpenAI", Description: "OpenAI multimodal models", Config: map[string]any{"ui_by_type": map[string]any{"image": map[string]any{"display_name": "GPT-Image", "icon": "ImageIcon", "accent": "from-violet-500/30 to-fuchsia-500/10", "description": "Detailed image generation.", "cost": "4 points"}}}, Enabled: true, SortOrder: 20, CreatedAt: now, UpdatedAt: now},
			{ID: "provider_suno", Name: "suno", DisplayName: "Suno", Description: "AI music models", Config: map[string]any{"ui_by_type": map[string]any{"music": map[string]any{"display_name": "Suno Music", "icon": "Music2", "accent": "from-cyan-500/30 to-blue-500/10", "description": "Full song generation.", "cost": "8 points"}}}, Enabled: true, SortOrder: 30, CreatedAt: now, UpdatedAt: now},
		},
		prompts: []Prompt{
			{ID: "prompt_video_1", ModelType: "video", Title: "City night", Content: "A cinematic night street scene with neon lights and slow camera movement.", Category: "demo", Enabled: true, SortOrder: 10, CreatedAt: now, UpdatedAt: now},
			{ID: "prompt_image_1", ModelType: "image", Title: "Product photo", Content: "A premium product photo on a marble table with soft studio lighting.", Category: "demo", Enabled: true, SortOrder: 10, CreatedAt: now, UpdatedAt: now},
			{ID: "prompt_music_1", ModelType: "music", Title: "Summer city", Content: "An upbeat electronic pop track for a summer city vlog.", Category: "demo", Enabled: true, SortOrder: 10, CreatedAt: now, UpdatedAt: now},
		},
		users: []User{{
			ID: "u_admin", Email: "admin@example.com", DisplayName: "Admin", AvatarURL: "", Points: 1000,
			UserType: "admin", Status: "active", VipTier: "lifetime", VipExpiresAt: "", CreatedAt: now, LastSignInAt: now,
		}},
		settings: SystemSettings{GatewayURL: "", UpdatedAt: now},
	}
}

func (s *Service) ListEnabledModels(ctx context.Context, modelType string) []Model {
	models := s.ListModels(ctx)
	out := make([]Model, 0, len(models))
	for _, m := range models {
		if !m.Enabled {
			continue
		}
		if modelType != "" && m.ModelType != modelType {
			continue
		}
		out = append(out, m)
	}
	return out
}

func (s *Service) ListEnabledProviders(ctx context.Context) []Provider {
	providers := s.ListProviders(ctx)
	out := make([]Provider, 0, len(providers))
	for _, p := range providers {
		if p.Enabled {
			out = append(out, p)
		}
	}
	return out
}

func (s *Service) ListEnabledPrompts(ctx context.Context, modelType string) []Prompt {
	prompts := s.ListPrompts(ctx)
	out := make([]Prompt, 0, len(prompts))
	for _, p := range prompts {
		if !p.Enabled {
			continue
		}
		if modelType != "" && p.ModelType != modelType {
			continue
		}
		out = append(out, p)
	}
	return out
}

func (s *Service) ListModels(ctx context.Context) []Model {
	if s.pool != nil {
		models, err := s.dbListModels(ctx)
		if err != nil {
			log.Printf("list admin models failed: %v", err)
			return []Model{}
		}
		return models
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Model{}, s.models...)
}
func (s *Service) CreateModel(ctx context.Context, m Model) (Model, error) {
	if m.Name == "" || m.Provider == "" || m.ModelType == "" {
		return Model{}, fmt.Errorf("invalid params")
	}
	if s.pool != nil {
		return s.dbCreateModel(ctx, m)
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
func (s *Service) UpdateModel(ctx context.Context, id string, patch map[string]any) (Model, error) {
	if s.pool != nil {
		return s.dbUpdateModel(ctx, id, patch)
	}
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
func (s *Service) DeleteModel(ctx context.Context, id string) error {
	if s.pool != nil {
		return s.dbDelete(ctx, "admin_models", id, "model not found")
	}
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

func (s *Service) ListProviders(ctx context.Context) []Provider {
	if s.pool != nil {
		providers, err := s.dbListProviders(ctx)
		if err != nil {
			log.Printf("list admin providers failed: %v", err)
			return []Provider{}
		}
		return providers
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Provider{}, s.providers...)
}
func (s *Service) CreateProvider(ctx context.Context, p Provider) (Provider, error) {
	if p.Name == "" {
		return Provider{}, fmt.Errorf("invalid params")
	}
	if s.pool != nil {
		return s.dbCreateProvider(ctx, p)
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
func (s *Service) UpdateProvider(ctx context.Context, id string, patch map[string]any) (Provider, error) {
	if s.pool != nil {
		return s.dbUpdateProvider(ctx, id, patch)
	}
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
func (s *Service) DeleteProvider(ctx context.Context, id string) error {
	if s.pool != nil {
		return s.dbDelete(ctx, "admin_providers", id, "provider not found")
	}
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

func (s *Service) ListPrompts(ctx context.Context) []Prompt {
	if s.pool != nil {
		prompts, err := s.dbListPrompts(ctx)
		if err != nil {
			log.Printf("list admin prompts failed: %v", err)
			return []Prompt{}
		}
		return prompts
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Prompt{}, s.prompts...)
}
func (s *Service) CreatePrompt(ctx context.Context, p Prompt) (Prompt, error) {
	if p.Title == "" || p.Content == "" {
		return Prompt{}, fmt.Errorf("invalid params")
	}
	if s.pool != nil {
		return s.dbCreatePrompt(ctx, p)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = fmt.Sprintf("prm_%d", time.Now().UnixNano())
	p.CreatedAt, p.UpdatedAt = now, now
	s.prompts = append(s.prompts, p)
	return p, nil
}
func (s *Service) UpdatePrompt(ctx context.Context, id string, patch map[string]any) (Prompt, error) {
	if s.pool != nil {
		return s.dbUpdatePrompt(ctx, id, patch)
	}
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
func (s *Service) DeletePrompt(ctx context.Context, id string) error {
	if s.pool != nil {
		return s.dbDelete(ctx, "admin_prompts", id, "prompt not found")
	}
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

func (s *Service) ListUsers(ctx context.Context) []User {
	if s.pool != nil {
		users, err := s.dbListUsers(ctx)
		if err != nil {
			log.Printf("list admin users failed: %v", err)
			return []User{}
		}
		return users
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]User{}, s.users...)
}
func (s *Service) UpdateUser(ctx context.Context, id string, patch map[string]any) (User, error) {
	if s.pool != nil {
		return s.dbUpdateUser(ctx, id, patch)
	}
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

func (s *Service) GetSettings(ctx context.Context) SystemSettings {
	if s.pool != nil {
		gateway := s.GetGateway(ctx)
		return SystemSettings{GatewayURL: gateway.GatewayURL, UpdatedAt: gateway.UpdatedAt}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}
func (s *Service) UpdateSettings(ctx context.Context, in SystemSettings) SystemSettings {
	if s.pool != nil {
		gateway := s.UpdateGateway(ctx, GatewaySettings{GatewayURL: in.GatewayURL})
		return SystemSettings{GatewayURL: gateway.GatewayURL, UpdatedAt: gateway.UpdatedAt}
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if in.GatewayURL != "" {
		s.settings.GatewayURL = in.GatewayURL
	}
	s.settings.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	return s.settings
}

func (s *Service) GetGateway(ctx context.Context) GatewaySettings {
	if s.pool != nil {
		var out GatewaySettings
		if err := s.getSetting(ctx, "gateway", &out); err == nil {
			return out
		} else {
			log.Printf("get gateway settings failed: %v", err)
		}
	}
	return GatewaySettings{}
}

func (s *Service) UpdateGateway(ctx context.Context, in GatewaySettings) GatewaySettings {
	if s.pool != nil {
		current := s.GetGateway(ctx)
		current.APIKey = in.APIKey
		current.GatewayURL = in.GatewayURL
		current.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		if err := s.putSetting(ctx, "gateway", current); err != nil {
			log.Printf("update gateway settings failed: %v", err)
		}
		return current
	}
	return GatewaySettings{APIKey: in.APIKey, GatewayURL: in.GatewayURL, UpdatedAt: time.Now().UTC().Format(time.RFC3339)}
}

func (s *Service) GetGenerationConfig(ctx context.Context) GenerationConfig {
	out := GenerationConfig{MusicTimeout: 600, ImageTimeout: 300, VideoTimeout: 1800}
	if s.pool != nil {
		if err := s.getSetting(ctx, "generation_config", &out); err == nil {
			return out
		} else {
			log.Printf("get generation config failed: %v", err)
		}
	}
	return out
}

func (s *Service) UpdateGenerationConfig(ctx context.Context, in GenerationConfig) GenerationConfig {
	if in.MusicTimeout < 60 {
		in.MusicTimeout = 600
	}
	if in.ImageTimeout < 60 {
		in.ImageTimeout = 300
	}
	if in.VideoTimeout < 120 {
		in.VideoTimeout = 1800
	}
	in.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if s.pool != nil {
		if err := s.putSetting(ctx, "generation_config", in); err != nil {
			log.Printf("update generation config failed: %v", err)
		}
	}
	return in
}

func (s *Service) GetPayment(ctx context.Context) map[string]any {
	out := defaultPaymentSettings()
	if s.pool != nil {
		if err := s.getSetting(ctx, "payment", &out); err != nil {
			log.Printf("get payment settings failed: %v", err)
		}
	}
	ensurePaymentDefaults(out)
	return out
}

func (s *Service) UpdatePayment(ctx context.Context, patch map[string]any) map[string]any {
	out := s.GetPayment(ctx)
	for key, value := range normalizePaymentPatch(patch) {
		out[key] = value
	}
	out["updated_at"] = time.Now().UTC().Format(time.RFC3339)
	if s.pool != nil {
		if err := s.putSetting(ctx, "payment", out); err != nil {
			log.Printf("update payment settings failed: %v", err)
		}
	}
	return out
}

func (s *Service) ActivatePayment(ctx context.Context) map[string]any {
	return s.UpdatePayment(ctx, map[string]any{"terminal_sn": "term_demo", "terminal_key": "term_key_demo"})
}

func (s *Service) CheckinPayment(ctx context.Context) map[string]any {
	return s.UpdatePayment(ctx, map[string]any{"updated_at": time.Now().UTC().Format(time.RFC3339)})
}

func (s *Service) getSetting(ctx context.Context, key string, dest any) error {
	var raw []byte
	var updatedAt time.Time
	if err := s.pool.QueryRow(ctx, `SELECT value, updated_at FROM admin_settings WHERE key=$1`, key).Scan(&raw, &updatedAt); err != nil {
		return err
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return err
	}
	switch v := dest.(type) {
	case *GatewaySettings:
		v.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	case *GenerationConfig:
		v.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	case *map[string]any:
		(*v)["updated_at"] = updatedAt.UTC().Format(time.RFC3339)
	}
	return nil
}

func (s *Service) putSetting(ctx context.Context, key string, value any) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `
INSERT INTO admin_settings (key, value, updated_at)
VALUES ($1, $2::jsonb, now())
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()
`, key, string(raw))
	return err
}

func defaultPaymentSettings() map[string]any {
	return map[string]any{
		"enabled": false, "vendor_sn": "", "vendor_key": "", "app_id": "", "terminal_sn": "", "terminal_key": "",
		"device_id": "", "operator": "", "notify_url": "", "return_url": "", "gateway_url": "", "callback_public_key": "", "test_mode": true, "updated_at": "",
	}
}

func ensurePaymentDefaults(value map[string]any) {
	for key, fallback := range defaultPaymentSettings() {
		if _, ok := value[key]; !ok {
			value[key] = fallback
		}
	}
}

func normalizePaymentPatch(in map[string]any) map[string]any {
	keys := map[string]string{
		"vendorSn": "vendor_sn", "vendorKey": "vendor_key", "appId": "app_id", "terminalSn": "terminal_sn", "terminalKey": "terminal_key",
		"deviceId": "device_id", "notifyUrl": "notify_url", "returnUrl": "return_url", "gatewayUrl": "gateway_url", "callbackPublicKey": "callback_public_key",
		"testMode": "test_mode",
	}
	out := map[string]any{}
	for key, value := range in {
		if mapped, ok := keys[key]; ok {
			out[mapped] = value
		} else {
			out[key] = value
		}
	}
	return out
}

func (s *Service) dbListModels(ctx context.Context) ([]Model, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order, created_at, updated_at
FROM admin_models
ORDER BY sort_order ASC, created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Model
	for rows.Next() {
		model, err := scanModel(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, model)
	}
	return out, rows.Err()
}

func (s *Service) dbCreateModel(ctx context.Context, m Model) (Model, error) {
	if m.ID == "" {
		m.ID = fmt.Sprintf("mdl_%d", time.Now().UnixNano())
	}
	if m.BillingType == "" {
		m.BillingType = "per_use"
	}
	cfg, err := json.Marshal(nonNilMap(m.Config))
	if err != nil {
		return Model{}, err
	}
	return s.scanModelRow(ctx, `
INSERT INTO admin_models (id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)
RETURNING id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order, created_at, updated_at
`, m.ID, m.Name, m.Provider, m.ModelType, m.BillingType, m.CostPerUse, m.Description, string(cfg), m.Enabled, m.SortOrder)
}

func (s *Service) dbUpdateModel(ctx context.Context, id string, patch map[string]any) (Model, error) {
	model, err := s.dbGetModel(ctx, id)
	if err != nil {
		return Model{}, err
	}
	if v, ok := stringPatch(patch, "name"); ok && v != "" {
		model.Name = v
	}
	if v, ok := stringPatch(patch, "provider"); ok && v != "" {
		model.Provider = v
	}
	if v, ok := stringPatch(patch, "modelType", "model_type"); ok && v != "" {
		model.ModelType = v
	}
	if v, ok := stringPatch(patch, "billingType", "billing_type"); ok && v != "" {
		model.BillingType = v
	}
	if v, ok := intPatch(patch, "costPerUse", "cost_per_use"); ok {
		model.CostPerUse = v
	}
	if v, ok := stringPatch(patch, "description"); ok {
		model.Description = v
	}
	if v, ok := boolPatch(patch, "enabled"); ok {
		model.Enabled = v
	}
	if v, ok := intPatch(patch, "sortOrder", "sort_order"); ok {
		model.SortOrder = v
	}
	if v, ok := mapPatch(patch, "config"); ok {
		model.Config = v
	}
	cfg, err := json.Marshal(nonNilMap(model.Config))
	if err != nil {
		return Model{}, err
	}
	return s.scanModelRow(ctx, `
UPDATE admin_models
SET name=$2, provider=$3, model_type=$4, billing_type=$5, cost_per_use=$6, description=$7, config=$8::jsonb, enabled=$9, sort_order=$10, updated_at=now()
WHERE id=$1
RETURNING id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order, created_at, updated_at
`, id, model.Name, model.Provider, model.ModelType, model.BillingType, model.CostPerUse, model.Description, string(cfg), model.Enabled, model.SortOrder)
}

func (s *Service) dbGetModel(ctx context.Context, id string) (Model, error) {
	model, err := s.scanModelRow(ctx, `
SELECT id, name, provider, model_type, billing_type, cost_per_use, description, config, enabled, sort_order, created_at, updated_at
FROM admin_models WHERE id=$1`, id)
	if err != nil && err == pgx.ErrNoRows {
		return Model{}, fmt.Errorf("model not found")
	}
	return model, err
}

func (s *Service) scanModelRow(ctx context.Context, sql string, args ...any) (Model, error) {
	row := s.pool.QueryRow(ctx, sql, args...)
	return scanModel(row)
}

func (s *Service) dbListProviders(ctx context.Context) ([]Provider, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, name, display_name, description, config, enabled, sort_order, created_at, updated_at
FROM admin_providers
ORDER BY sort_order ASC, created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Provider
	for rows.Next() {
		provider, err := scanProvider(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, provider)
	}
	return out, rows.Err()
}

func (s *Service) dbCreateProvider(ctx context.Context, p Provider) (Provider, error) {
	if p.ID == "" {
		p.ID = fmt.Sprintf("prv_%d", time.Now().UnixNano())
	}
	if p.DisplayName == "" {
		p.DisplayName = p.Name
	}
	cfg, err := json.Marshal(nonNilMap(p.Config))
	if err != nil {
		return Provider{}, err
	}
	return s.scanProviderRow(ctx, `
INSERT INTO admin_providers (id, name, display_name, description, config, enabled, sort_order)
VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
RETURNING id, name, display_name, description, config, enabled, sort_order, created_at, updated_at
`, p.ID, p.Name, p.DisplayName, p.Description, string(cfg), p.Enabled, p.SortOrder)
}

func (s *Service) dbUpdateProvider(ctx context.Context, id string, patch map[string]any) (Provider, error) {
	provider, err := s.dbGetProvider(ctx, id)
	if err != nil {
		return Provider{}, err
	}
	if v, ok := stringPatch(patch, "name"); ok && v != "" {
		provider.Name = v
	}
	if v, ok := stringPatch(patch, "displayName", "display_name"); ok {
		provider.DisplayName = v
	}
	if v, ok := stringPatch(patch, "description"); ok {
		provider.Description = v
	}
	if v, ok := boolPatch(patch, "enabled"); ok {
		provider.Enabled = v
	}
	if v, ok := intPatch(patch, "sortOrder", "sort_order"); ok {
		provider.SortOrder = v
	}
	if v, ok := mapPatch(patch, "config"); ok {
		provider.Config = v
	}
	cfg, err := json.Marshal(nonNilMap(provider.Config))
	if err != nil {
		return Provider{}, err
	}
	return s.scanProviderRow(ctx, `
UPDATE admin_providers
SET name=$2, display_name=$3, description=$4, config=$5::jsonb, enabled=$6, sort_order=$7, updated_at=now()
WHERE id=$1
RETURNING id, name, display_name, description, config, enabled, sort_order, created_at, updated_at
`, id, provider.Name, provider.DisplayName, provider.Description, string(cfg), provider.Enabled, provider.SortOrder)
}

func (s *Service) dbGetProvider(ctx context.Context, id string) (Provider, error) {
	provider, err := s.scanProviderRow(ctx, `
SELECT id, name, display_name, description, config, enabled, sort_order, created_at, updated_at
FROM admin_providers WHERE id=$1`, id)
	if err != nil && err == pgx.ErrNoRows {
		return Provider{}, fmt.Errorf("provider not found")
	}
	return provider, err
}

func (s *Service) scanProviderRow(ctx context.Context, sql string, args ...any) (Provider, error) {
	row := s.pool.QueryRow(ctx, sql, args...)
	return scanProvider(row)
}

func (s *Service) dbListPrompts(ctx context.Context) ([]Prompt, error) {
	rows, err := s.pool.Query(ctx, `
SELECT id, model_type, title, content, category, enabled, sort_order, created_at, updated_at
FROM admin_prompts
ORDER BY sort_order ASC, created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Prompt
	for rows.Next() {
		prompt, err := scanPrompt(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, prompt)
	}
	return out, rows.Err()
}

func (s *Service) dbCreatePrompt(ctx context.Context, p Prompt) (Prompt, error) {
	if p.ID == "" {
		p.ID = fmt.Sprintf("prm_%d", time.Now().UnixNano())
	}
	return s.scanPromptRow(ctx, `
INSERT INTO admin_prompts (id, model_type, title, content, category, enabled, sort_order)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING id, model_type, title, content, category, enabled, sort_order, created_at, updated_at
`, p.ID, p.ModelType, p.Title, p.Content, p.Category, p.Enabled, p.SortOrder)
}

func (s *Service) dbUpdatePrompt(ctx context.Context, id string, patch map[string]any) (Prompt, error) {
	prompt, err := s.dbGetPrompt(ctx, id)
	if err != nil {
		return Prompt{}, err
	}
	if v, ok := stringPatch(patch, "modelType", "model_type"); ok && v != "" {
		prompt.ModelType = v
	}
	if v, ok := stringPatch(patch, "title"); ok && v != "" {
		prompt.Title = v
	}
	if v, ok := stringPatch(patch, "content"); ok && v != "" {
		prompt.Content = v
	}
	if v, ok := stringPatch(patch, "category"); ok {
		prompt.Category = v
	}
	if v, ok := boolPatch(patch, "enabled"); ok {
		prompt.Enabled = v
	}
	if v, ok := intPatch(patch, "sortOrder", "sort_order"); ok {
		prompt.SortOrder = v
	}
	return s.scanPromptRow(ctx, `
UPDATE admin_prompts
SET model_type=$2, title=$3, content=$4, category=$5, enabled=$6, sort_order=$7, updated_at=now()
WHERE id=$1
RETURNING id, model_type, title, content, category, enabled, sort_order, created_at, updated_at
`, id, prompt.ModelType, prompt.Title, prompt.Content, prompt.Category, prompt.Enabled, prompt.SortOrder)
}

func (s *Service) dbGetPrompt(ctx context.Context, id string) (Prompt, error) {
	prompt, err := s.scanPromptRow(ctx, `
SELECT id, model_type, title, content, category, enabled, sort_order, created_at, updated_at
FROM admin_prompts WHERE id=$1`, id)
	if err != nil && err == pgx.ErrNoRows {
		return Prompt{}, fmt.Errorf("prompt not found")
	}
	return prompt, err
}

func (s *Service) scanPromptRow(ctx context.Context, sql string, args ...any) (Prompt, error) {
	row := s.pool.QueryRow(ctx, sql, args...)
	return scanPrompt(row)
}

func (s *Service) dbDelete(ctx context.Context, table, id, notFoundMessage string) error {
	tag, err := s.pool.Exec(ctx, fmt.Sprintf("DELETE FROM %s WHERE id=$1", table), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("%s", notFoundMessage)
	}
	return nil
}

func (s *Service) dbListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.pool.Query(ctx, `
SELECT u.id::text, u.email, COALESCE(p.display_name, ''), COALESCE(p.avatar_url, ''),
       COALESCE(p.points, 0), u.role, u.status, p.vip_tier, p.vip_expires_at,
       u.created_at, u.last_login_at
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
WHERE u.status <> 'deleted'
ORDER BY u.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []User
	for rows.Next() {
		user, err := scanAdminUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, user)
	}
	return out, rows.Err()
}

func (s *Service) dbUpdateUser(ctx context.Context, id string, patch map[string]any) (User, error) {
	user, err := s.dbGetUser(ctx, id)
	if err != nil {
		return User{}, err
	}

	if v, ok := stringPatch(patch, "displayName", "display_name"); ok {
		user.DisplayName = v
	}
	if v, ok := stringPatch(patch, "avatarUrl", "avatar_url"); ok {
		user.AvatarURL = v
	}
	if v, ok := stringPatch(patch, "userType", "user_type", "role"); ok && v != "" {
		user.UserType = normalizeUserType(v)
	}
	if v, ok := stringPatch(patch, "status"); ok && v != "" {
		user.Status = v
	}
	if v, ok := stringPatch(patch, "vipTier", "vip_tier"); ok {
		user.VipTier = v
	}
	if value, ok := patch["vipExpiresAt"]; ok {
		user.VipExpiresAt = stringFromAny(value)
	} else if value, ok := patch["vip_expires_at"]; ok {
		user.VipExpiresAt = stringFromAny(value)
	}
	if v, ok := intPatch(patch, "points"); ok && v >= 0 {
		user.Points = v
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, err
	}
	defer tx.Rollback(ctx)

	role := "user"
	if user.UserType == "admin" {
		role = "admin"
	}
	tag, err := tx.Exec(ctx, `UPDATE users SET role=$2, status=$3, updated_at=now() WHERE id=$1`, id, role, user.Status)
	if err != nil {
		return User{}, err
	}
	if tag.RowsAffected() == 0 {
		return User{}, fmt.Errorf("user not found")
	}

	vipTier := nullableString(user.VipTier)
	vipExpiresAt, err := nullableTime(user.VipExpiresAt)
	if err != nil {
		return User{}, err
	}
	_, err = tx.Exec(ctx, `
INSERT INTO user_profiles (user_id, display_name, avatar_url, points, vip_tier, vip_expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id) DO UPDATE SET
  display_name=EXCLUDED.display_name,
  avatar_url=EXCLUDED.avatar_url,
  points=EXCLUDED.points,
  vip_tier=EXCLUDED.vip_tier,
  vip_expires_at=EXCLUDED.vip_expires_at,
  updated_at=now()
`, id, user.DisplayName, user.AvatarURL, user.Points, vipTier, vipExpiresAt)
	if err != nil {
		return User{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, err
	}
	return s.dbGetUser(ctx, id)
}

func (s *Service) dbGetUser(ctx context.Context, id string) (User, error) {
	user, err := s.scanAdminUserRow(ctx, `
SELECT u.id::text, u.email, COALESCE(p.display_name, ''), COALESCE(p.avatar_url, ''),
       COALESCE(p.points, 0), u.role, u.status, p.vip_tier, p.vip_expires_at,
       u.created_at, u.last_login_at
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
WHERE u.id=$1`, id)
	if err != nil && err == pgx.ErrNoRows {
		return User{}, fmt.Errorf("user not found")
	}
	return user, err
}

func (s *Service) scanAdminUserRow(ctx context.Context, sql string, args ...any) (User, error) {
	row := s.pool.QueryRow(ctx, sql, args...)
	return scanAdminUser(row)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanAdminUser(row scanner) (User, error) {
	var user User
	var role string
	var vipTier sql.NullString
	var vipExpiresAt sql.NullTime
	var createdAt time.Time
	var lastLoginAt sql.NullTime
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.AvatarURL,
		&user.Points,
		&role,
		&user.Status,
		&vipTier,
		&vipExpiresAt,
		&createdAt,
		&lastLoginAt,
	)
	if err != nil {
		return User{}, err
	}
	user.UserType = normalizeUserType(role)
	if vipTier.Valid {
		user.VipTier = vipTier.String
	}
	if vipExpiresAt.Valid {
		user.VipExpiresAt = vipExpiresAt.Time.UTC().Format(time.RFC3339)
	}
	user.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	if lastLoginAt.Valid {
		user.LastSignInAt = lastLoginAt.Time.UTC().Format(time.RFC3339)
	}
	return user, nil
}

func scanModel(row scanner) (Model, error) {
	var m Model
	var cfg []byte
	var createdAt time.Time
	var updatedAt time.Time
	err := row.Scan(&m.ID, &m.Name, &m.Provider, &m.ModelType, &m.BillingType, &m.CostPerUse, &m.Description, &cfg, &m.Enabled, &m.SortOrder, &createdAt, &updatedAt)
	if err != nil {
		return Model{}, err
	}
	m.Config = decodeConfig(cfg)
	m.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	m.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return m, nil
}

func scanProvider(row scanner) (Provider, error) {
	var p Provider
	var cfg []byte
	var createdAt time.Time
	var updatedAt time.Time
	err := row.Scan(&p.ID, &p.Name, &p.DisplayName, &p.Description, &cfg, &p.Enabled, &p.SortOrder, &createdAt, &updatedAt)
	if err != nil {
		return Provider{}, err
	}
	p.Config = decodeConfig(cfg)
	p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return p, nil
}

func scanPrompt(row scanner) (Prompt, error) {
	var p Prompt
	var createdAt time.Time
	var updatedAt time.Time
	err := row.Scan(&p.ID, &p.ModelType, &p.Title, &p.Content, &p.Category, &p.Enabled, &p.SortOrder, &createdAt, &updatedAt)
	if err != nil {
		return Prompt{}, err
	}
	p.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	p.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return p, nil
}

func decodeConfig(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var cfg map[string]any
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return map[string]any{}
	}
	return cfg
}

func nonNilMap(in map[string]any) map[string]any {
	if in == nil {
		return map[string]any{}
	}
	return in
}

func normalizeUserType(value string) string {
	if value == "admin" {
		return "admin"
	}
	return "normal"
}

func nullableString(value string) any {
	if value == "" || value == "none" {
		return nil
	}
	return value
}

func nullableTime(value string) (any, error) {
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, fmt.Errorf("invalid vipExpiresAt")
	}
	return parsed, nil
}

func stringFromAny(value any) string {
	if value == nil {
		return ""
	}
	if s, ok := value.(string); ok {
		return s
	}
	return ""
}

func stringPatch(patch map[string]any, keys ...string) (string, bool) {
	for _, key := range keys {
		if value, ok := patch[key]; ok {
			if value == nil {
				return "", true
			}
			s, ok := value.(string)
			return s, ok
		}
	}
	return "", false
}

func boolPatch(patch map[string]any, keys ...string) (bool, bool) {
	for _, key := range keys {
		if value, ok := patch[key]; ok {
			b, ok := value.(bool)
			return b, ok
		}
	}
	return false, false
}

func intPatch(patch map[string]any, keys ...string) (int, bool) {
	for _, key := range keys {
		if value, ok := patch[key]; ok {
			switch v := value.(type) {
			case int:
				return v, true
			case float64:
				return int(v), true
			case json.Number:
				i, err := v.Int64()
				return int(i), err == nil
			default:
				return 0, false
			}
		}
	}
	return 0, false
}

func mapPatch(patch map[string]any, keys ...string) (map[string]any, bool) {
	for _, key := range keys {
		if value, ok := patch[key]; ok {
			if value == nil {
				return map[string]any{}, true
			}
			m, ok := value.(map[string]any)
			return m, ok
		}
	}
	return nil, false
}
