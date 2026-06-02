package main

import (
	"io/fs"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"

	"golden-financier/handler"
	"golden-financier/migrate"
)

func main() {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./finance.db"
	}

	db, err := sqlx.Open("sqlite", dbPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	if err := migrate.Run(db.DB); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("migrations applied")

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	ah := &handler.AccountHandler{DB: db}
	ch := &handler.CategoryHandler{DB: db}
	th := &handler.TransactionHandler{DB: db}
	rh := &handler.ReportHandler{DB: db}

	auth := handler.NewAuthHandler(db)
	authRateLimiter := handler.NewRateLimiter(10, time.Minute)
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Use(authRateLimiter.Middleware)
		r.Post("/register", auth.Register)
		r.Post("/login", auth.Login)
		r.Post("/refresh", auth.Refresh)
		r.Post("/forgot-password", auth.ForgotPassword)
		r.Post("/reset-password", auth.ResetPassword)
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(handler.AuthMiddleware)

		r.Get("/me", auth.Me)

		r.Route("/accounts", func(r chi.Router) {
			r.Get("/", ah.List)
			r.Post("/", ah.Create)
			r.Get("/{id}", ah.Get)
			r.Put("/{id}", ah.Update)
			r.Delete("/{id}", ah.Archive)
		})

		r.Route("/categories", func(r chi.Router) {
			r.Get("/", ch.List)
			r.Post("/", ch.Create)
			r.Get("/{id}", ch.Get)
			r.Put("/{id}", ch.Update)
			r.Delete("/{id}", ch.Delete)
		})

		r.Route("/transactions", func(r chi.Router) {
			r.Get("/", th.List)
			r.Post("/", th.Create)
			r.Get("/{id}", th.Get)
			r.Put("/{id}", th.Update)
			r.Delete("/{id}", th.Delete)
		})

		r.Route("/reports", func(r chi.Router) {
			r.Get("/monthly", rh.Monthly)
			r.Get("/net-worth", rh.NetWorth)
		})
	})

	// Serve embedded frontend
	serveFrontend(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func serveFrontend(r chi.Router) {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		log.Printf("no embedded frontend dist found, skipping: %v", err)
		return
	}

	// Check if dist has actual files (not just .gitkeep)
	if _, err := fs.Stat(sub, "index.html"); err != nil {
		log.Println("no index.html in dist, skipping frontend serve")
		return
	}

	r.Get("/assets/*", func(w http.ResponseWriter, r *http.Request) {
		filePath := r.URL.Path[1:] // remove leading "/" -> "assets/foo.js"
		data, err := fs.ReadFile(sub, filePath)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		ext := filepath.Ext(filePath)
		if mimeType := mime.TypeByExtension(ext); mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		}
		w.Write(data)
	})

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" {
			return
		}
		data, err := fs.ReadFile(sub, "index.html")
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(data)
	})
}
