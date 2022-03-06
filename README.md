# HávaBot

## About

HávaBot is a discord bot that sends daily quotes to a specified discord channel

## Build

How to build the bot

### Docker
```sh
docker build -t <your tag> .
```

## Run

The recommended way to run the bot is with a docker-compose file

### Docker-compose
```yml
version: '3.5'

services:
    havabot:
        image: <image name>
        container_name: havabot
        restart: unless-stopped
        depends_on:
          - db
        environment:
          - "DISCORD_TOKEN=<your token here>"
          - "DB_URL=mongodb://db:27017/havabot"
        networks:
          - havabot

    db:
        image: mongo
        container_name: havabot_db
        restart: unless-stopped
        networks:
          - havabot
        volumes:
          - ./db:/data/db

networks:
    havabot:
        driver: bridge
```

### Permissions

HávaBot requires the following permissions to function:
- Read Messages/View Channels
- Send Messages
- Read Message History

## Author

Kai HTML (Talimere) 2022 \
[GitHub](https://github.com/RootAlgorithm)
