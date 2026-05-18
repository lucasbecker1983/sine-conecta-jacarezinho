# IA para Currículos

O módulo `backend/app/ai` define a interface `AIProvider`.

Provider inicial:

- `LocalAIProvider`;
- regras simples e palavras-chave;
- não depende de API externa;
- extrai habilidades, escolaridade, cargos anteriores, resumo, score estimado e perguntas.

A IA não rejeita candidatos automaticamente. O frontend informa que a análise automática é sugestiva e que a decisão final é do colaborador responsável.

Providers futuros podem implementar OpenAI, Ollama, HuggingFace, modelos locais ou outros serviços.
