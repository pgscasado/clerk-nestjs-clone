#!/bin/bash

# Inicia o Redis em backgroundflyct
redis-server --daemonize yes

# Espera um pouco para o Redis estar pronto (ou você pode usar algo mais sofisticado como wait-for-it)
sleep 2

# Inicia o app NestJS
npm run start:prod