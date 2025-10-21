const app = require('./dist/app.js').default
const { config } = require('./dist/config/index.js')

const PORT = config.port || 3001

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`)
  console.log(`📊 Environnement: ${config.nodeEnv}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`📚 Documentation: http://localhost:${PORT}/api-docs`)
})