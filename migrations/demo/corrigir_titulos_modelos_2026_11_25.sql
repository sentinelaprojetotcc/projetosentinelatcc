-- Apenas para sentinela-db-preview. Modelos academicos de demonstracao permanecem sinalizados no site.
-- Corrige somente os 12 modelos sintéticos carregados em 25/11/2026, sem mudar IDs, métricas, datas ou vínculos.
UPDATE models
SET title = TRIM(REPLACE(REPLACE(REPLACE(title, 'Modelo experimental fictício', 'Modelo experimental'), 'Modelo acadêmico fictício', 'Modelo experimental'), '[DEMO]', ''))
WHERE id IN ('822ee825-2477-5096-a4f5-47cb34e9062c', '812ee692-2577-5229-a3f5-463835e907bf', '802ee4ff-2277-5d70-a6f5-4af136e90952', '7f2ee36c-2377-5f03-a5f5-495e37e90ae5', '7e2ee1d9-2877-56e2-a8f5-4e1730e8ffe0', '7d2ee046-2977-5875-a7f5-4c8431e90173', '7c2edeb3-2677-53bc-aaf5-513d32e90306', '7b2edd20-2777-554f-a9f5-4faa33e90499', '8a2ef4bd-2c77-5d2e-acf5-3b333ce912c4', '892ef32a-2d77-5ec1-abf5-39a03de91457', 'fed51106-1421-5d5b-a31d-3e986cd6e61d', 'ffd51299-1321-5bc8-a41d-402b6bd6e48a')
  AND created_by IN (SELECT id FROM users WHERE email LIKE '%@sentinela.example.invalid')
  AND (title LIKE '%experimental fictício%' OR title LIKE '%acadêmico fictício%' OR title LIKE '%[DEMO]%');
