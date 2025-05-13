# Backend

백엔드는 API, Clickhouse (database), NATS (message queue)로 구성됩니다. 단순히 테스트를 위해 실행을 하려는 경우, Frontend, Backend, AI가 모두 실행되는 통합 실행을 권장합니다. 밑에서는 각각 실행하는 방법에 대해 설명합니다.

## How to run
1. api 디렉토리로 이동 후 docker compose를 사용해 실행합니다.
   ```bash
   cd api
   cp .env.example .env
   vi .env # env를 수정합니다
   docker compose up -d --build
   ```
2. clickhouse 디렉토리로 이동 후 docker compose를 사용해 실행합니다.
   ```bash
   cd clickhouse
   cp .env.example .env
   vi .env # env를 수정합니다
   docker compose up -d
   ```
3. nats 디렉토리로 이동 후 docker compose를 사용해 실행합니다.
   ```bash
   cd nats
   cp .env.example .env
   vi .env # env를 수정합니다
   docker compose up -d
   ```
