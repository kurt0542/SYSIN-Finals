FROM postgres:16-alpine

# Bake in the initialization schema and seed data
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
