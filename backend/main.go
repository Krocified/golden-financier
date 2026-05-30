package main

import (
	"log"
	"net/http"
	"os"

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

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(handler.AuthMiddleware)
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
