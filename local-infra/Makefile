.DEFAULT_GOAL := help
.PHONY: help

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "%-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build server's image
	@docker compose build server

up: ## Start Server and DB containers
	@docker compose up -d

db: ## Start Database containers only
	@docker compose up -d postgres

down: ## Stop Server and DB containers
	@docker compose down

db-exec: ## Access bash in postgres container
	@docker compose exec -it postgres bash

server-logs: ## View logs of the server container
	@docker compose logs -f server

db-logs: ## View logs of the postgres container
	@docker compose logs -f postgres

redis: ## Start Redis containers only
	@docker compose up -d redis

redis-sh: ## Access shell in redis container
	@docker compose exec redis bash

redis-logs: ## View logs of the redis container
	@docker logs -f redis