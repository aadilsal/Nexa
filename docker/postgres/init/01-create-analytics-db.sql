SELECT 'CREATE DATABASE nexa_analytics'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexa_analytics')\gexec
