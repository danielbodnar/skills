package main

// TruffleHog Custom Verification Server in Go
// A comprehensive Go-based verification server for custom TruffleHog detectors

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

// Configuration structure
type Config struct {
	Port       int    `json:"port"`
	Host       string `json:"host"`
	AuthHeader string `json:"auth_header"`
	RateLimit  int    `json:"rate_limit"`
	CacheTTL   int    `json:"cache_ttl"`
	LogLevel   string `json:"log_level"`
}

// Default configuration
var config = Config{
	Port:       8000,
	Host:       "0.0.0.0",
	AuthHeader: "super secret authorization header",
	RateLimit:  100,
	CacheTTL:   300,
	LogLevel:   "INFO",
}

// Request structures
type DetectorRequest struct {
	Token string `json:"token"`
}

type VerificationRequest map[string]DetectorRequest

// Response structures
type VerificationResult struct {
	Valid     bool   `json:"valid"`
	Timestamp string `json:"timestamp"`
}

type VerificationResponse struct {
	Results     map[string]VerificationResult `json:"results"`
	ProcessedAt string                        `json:"processed_at"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Version   string `json:"version"`
}

type MetricsResponse struct {
	CacheSize         int    `json:"cache_size"`
	RateLimiterClients int    `json:"rate_limiter_clients"`
	Timestamp         string `json:"timestamp"`
}

// Rate limiter
type RateLimiter struct {
	mu           sync.Mutex
	requests     map[string][]time.Time
	maxRequests  int
	windowPeriod time.Duration
}

func NewRateLimiter(maxRequests int, windowPeriod time.Duration) *RateLimiter {
	return &RateLimiter{
		requests:     make(map[string][]time.Time),
		maxRequests:  maxRequests,
		windowPeriod: windowPeriod,
	}
}

func (rl *RateLimiter) IsAllowed(clientIP string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.windowPeriod)

	// Clean old requests
	for ip, timestamps := range rl.requests {
		var filtered []time.Time
		for _, ts := range timestamps {
			if ts.After(cutoff) {
				filtered = append(filtered, ts)
			}
		}
		if len(filtered) == 0 {
			delete(rl.requests, ip)
		} else {
			rl.requests[ip] = filtered
		}
	}

	// Check current client
	clientRequests := rl.requests[clientIP]
	if len(clientRequests) >= rl.maxRequests {
		return false
	}

	// Add current request
	rl.requests[clientIP] = append(clientRequests, now)
	return true
}

func (rl *RateLimiter) GetClientCount() int {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	return len(rl.requests)
}

// Token cache
type CacheEntry struct {
	Result    bool
	Timestamp time.Time
}

type TokenCache struct {
	mu      sync.RWMutex
	entries map[string]CacheEntry
	ttl     time.Duration
}

func NewTokenCache(ttl time.Duration) *TokenCache {
	return &TokenCache{
		entries: make(map[string]CacheEntry),
		ttl:     ttl,
	}
}

func (tc *TokenCache) generateKey(token string) string {
	hash := md5.Sum([]byte(token))
	return fmt.Sprintf("%x", hash)
}

func (tc *TokenCache) Get(token string) (bool, bool) {
	tc.mu.RLock()
	defer tc.mu.RUnlock()

	key := tc.generateKey(token)
	entry, exists := tc.entries[key]
	if !exists {
		return false, false
	}

	if time.Since(entry.Timestamp) > tc.ttl {
		delete(tc.entries, key)
		return false, false
	}

	return entry.Result, true
}

func (tc *TokenCache) Set(token string, result bool) {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	key := tc.generateKey(token)
	tc.entries[key] = CacheEntry{
		Result:    result,
		Timestamp: time.Now(),
	}
}

func (tc *TokenCache) Size() int {
	tc.mu.RLock()
	defer tc.mu.RUnlock()
	return len(tc.entries)
}

// Token validator
type TokenValidator struct {
	cache *TokenCache
}

func NewTokenValidator(cacheTTL time.Duration) *TokenValidator {
	return &TokenValidator{
		cache: NewTokenCache(cacheTTL),
	}
}

func (tv *TokenValidator) ValidateToken(token, detectorName string) bool {
	// Check cache first
	if result, found := tv.cache.Get(token); found {
		log.Printf("Cache hit for %s token validation", detectorName)
		return result
	}

	// Validate based on detector type
	var result bool
	switch detectorName {
	case "MyAPIKeyDetector":
		result = tv.validateMyAPIKey(token)
	case "GitHubTokenDetector":
		result = tv.validateGitHubToken(token)
	case "SlackTokenDetector":
		result = tv.validateSlackToken(token)
	case "AWSDetector":
		result = tv.validateAWSCredentials(token)
	default:
		result = tv.validateGenericToken(token)
	}

	// Cache result
	tv.cache.Set(token, result)
	return result
}

func (tv *TokenValidator) validateMyAPIKey(token string) bool {
	// Example validation logic
	if !strings.HasPrefix(token, "myapi_") {
		return false
	}

	if len(token) != 38 { // myapi_ + 32 chars
		return false
	}

	// Additional validation logic would go here
	return tv.mockValidation(token)
}

func (tv *TokenValidator) validateGitHubToken(token string) bool {
	// In a real implementation, this would make an API call to GitHub
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		log.Printf("GitHub token validation error: %v", err)
		return false
	}

	req.Header.Set("Authorization", "token "+token)
	req.Header.Set("User-Agent", "TruffleHog-Custom-Verifier")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("GitHub token validation error: %v", err)
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == 200
}

func (tv *TokenValidator) validateSlackToken(token string) bool {
	// In a real implementation, this would make an API call to Slack
	data := strings.NewReader(fmt.Sprintf("token=%s", token))
	client := &http.Client{Timeout: 10 * time.Second}
	
	req, err := http.NewRequest("POST", "https://slack.com/api/auth.test", data)
	if err != nil {
		log.Printf("Slack token validation error: %v", err)
		return false
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Slack token validation error: %v", err)
		return false
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false
	}

	if ok, exists := result["ok"].(bool); exists {
		return ok
	}

	return false
}

func (tv *TokenValidator) validateAWSCredentials(token string) bool {
	// This would require AWS SDK and proper implementation
	log.Println("AWS credential validation requested")
	return tv.mockValidation(token)
}

func (tv *TokenValidator) validateGenericToken(token string) bool {
	// Basic validation rules
	if len(token) < 16 {
		return false
	}

	// Check for test/demo tokens
	testPatterns := []string{"test", "demo", "example", "placeholder", "fake"}
	tokenLower := strings.ToLower(token)
	for _, pattern := range testPatterns {
		if strings.Contains(tokenLower, pattern) {
			return false
		}
	}

	return tv.mockValidation(token)
}

func (tv *TokenValidator) mockValidation(token string) bool {
	// Simulate API call delay
	time.Sleep(100 * time.Millisecond)

	// Simple hash-based validation for demo
	hash := md5.Sum([]byte(token))
	// Return true if first byte is even (50% chance)
	return hash[0]%2 == 0
}

// HTTP handlers
type Server struct {
	rateLimiter *RateLimiter
	validator   *TokenValidator
}

func NewServer() *Server {
	return &Server{
		rateLimiter: NewRateLimiter(config.RateLimit, time.Minute),
		validator:   NewTokenValidator(time.Duration(config.CacheTTL) * time.Second),
	}
}

func (s *Server) getClientIP(r *http.Request) string {
	// Check for forwarded headers first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.Split(xff, ",")[0]
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

func (s *Server) writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		s.writeJSON(w, http.StatusMethodNotAllowed, ErrorResponse{
			Error: "Only GET method is allowed",
		})
		return
	}

	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
	}

	s.writeJSON(w, http.StatusOK, response)
}

func (s *Server) metricsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		s.writeJSON(w, http.StatusMethodNotAllowed, ErrorResponse{
			Error: "Only GET method is allowed",
		})
		return
	}

	response := MetricsResponse{
		CacheSize:         s.validator.cache.Size(),
		RateLimiterClients: s.rateLimiter.GetClientCount(),
		Timestamp:         time.Now().UTC().Format(time.RFC3339),
	}

	s.writeJSON(w, http.StatusOK, response)
}

func (s *Server) verifyHandler(w http.ResponseWriter, r *http.Request) {
	clientIP := s.getClientIP(r)

	// Only allow POST requests
	if r.Method != "POST" {
		log.Printf("Method not allowed from %s: %s", clientIP, r.Method)
		s.writeJSON(w, http.StatusMethodNotAllowed, ErrorResponse{
			Error: "Only POST requests are supported for verification",
		})
		return
	}

	// Rate limiting
	if !s.rateLimiter.IsAllowed(clientIP) {
		log.Printf("Rate limit exceeded for %s", clientIP)
		s.writeJSON(w, http.StatusTooManyRequests, ErrorResponse{
			Error: "Rate limit exceeded",
		})
		return
	}

	// Verify authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader != config.AuthHeader {
		log.Printf("Unauthorized request from %s", clientIP)
		s.writeJSON(w, http.StatusUnauthorized, ErrorResponse{
			Error: "Unauthorized",
		})
		return
	}

	// Read and parse request body
	body, err := io.ReadAll(r.Body)
	if err != nil || len(body) == 0 {
		s.writeJSON(w, http.StatusBadRequest, ErrorResponse{
			Error: "Empty or invalid request body",
		})
		return
	}

	var request VerificationRequest
	if err := json.Unmarshal(body, &request); err != nil {
		log.Printf("Invalid JSON from %s: %v", clientIP, err)
		s.writeJSON(w, http.StatusBadRequest, ErrorResponse{
			Error: "Invalid JSON format",
		})
		return
	}

	log.Printf("Verification request from %s: %d detectors", clientIP, len(request))

	// Process each detector in the request
	results := make(map[string]VerificationResult)
	hasValidToken := false

	for detectorName, detectorData := range request {
		if detectorData.Token != "" {
			isValid := s.validator.ValidateToken(detectorData.Token, detectorName)
			results[detectorName] = VerificationResult{
				Valid:     isValid,
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			}

			if isValid {
				hasValidToken = true
			}

			log.Printf("Token validation for %s: %s", detectorName, 
				map[bool]string{true: "VALID", false: "INVALID"}[isValid])
		}
	}

	// Determine response status
	statusCode := http.StatusForbidden // 403 - all tokens invalid
	if hasValidToken {
		statusCode = http.StatusOK // 200 - at least one token valid
	}

	response := VerificationResponse{
		Results:     results,
		ProcessedAt: time.Now().UTC().Format(time.RFC3339),
	}

	s.writeJSON(w, statusCode, response)
}

func (s *Server) setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.verifyHandler)
	mux.HandleFunc("/health", s.healthHandler)
	mux.HandleFunc("/metrics", s.metricsHandler)
	return mux
}

func main() {
	// Set up signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Create server
	server := NewServer()
	mux := server.setupRoutes()

	// Start HTTP server
	httpServer := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", config.Host, config.Port),
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("TruffleHog Verification Server starting on %s:%d", config.Host, config.Port)
		log.Println("Endpoints:")
		log.Println("  POST /          - Token verification")
		log.Println("  GET  /health    - Health check")
		log.Println("  GET  /metrics   - Server metrics")

		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-sigChan
	log.Println("Received shutdown signal, stopping server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Println("Server shutdown complete")
}