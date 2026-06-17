module.exports = {
  apps: [
    {
      name: "backend-3001",
      script: "server.js",
      env: { PORT: 3001 }
    },
    {
      name: "backend-3002",
      script: "server.js",
      env: { PORT: 3002 }
    },
    {
      name: "backend-3003",
      script: "server.js",
      env: { PORT: 3003 }
    }
  ]
};
