
# Playstation Physical Collector's Site

## Tech Stack
![NestJs](https://img.shields.io/badge/nestjs-E0234E?style=flat&logo=nestjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) ![NextJs](https://img.shields.io/badge/NextJs-000000?style=flat&logo=next,js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![API](https://img.shields.io/badge/API-REST-0A66C2?style=flat) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) 

## Description
Full-stack application with a separate backend built in Nest.Js API with MySQL and Docker, and a frontend developed in Next.js, TypeScript, and Tailwind CSS. Application designed for collectors of physical games released on playstation consoles.

## Running the application

### Prerequisites
Before launching the project, make sure you have installed:
* **Docker** (and the Docker Desktop service / daemon running)

###  Installation
After download please startup docker and then run below commands in order. First one builds the application and prepares the Docker containers required by the project. Second one installs the required dependencies, runs database migrations, and seeds the database with the initial data.

Windows:
```bash
npm run build:windows
npm run setup
```

Linux\OS
```bash
npm run build:other
npm run setup
```

### Startup
To launch the application, run the command in the terminal.:

```bash
npm run start
```







