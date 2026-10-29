import { useEffect, useState } from 'react'
import keycloak from './keycloak'
import './App.css'

// Backend Spring Boot (voir application.properties : server.port=8081)
const API_URL = 'http://localhost:8081'

function App() {
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [notes, setNotes] = useState([])
  const [error, setError] = useState(null)

  // Appelle /api/notes en joignant le JWT, avec refresh du token si besoin
  async function loadNotes() {
    try {
      // Si le token expire dans moins de 30s, Keycloak en génère un nouveau
      await keycloak.updateToken(30)

      const response = await fetch(`${API_URL}/api/notes`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`)
      }

      setNotes(await response.json())
    } catch (e) {
      setError(`Impossible de charger les notes : ${e.message}`)
    }
  }

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then((isAuth) => {
        setAuthenticated(isAuth)
        if (isAuth) {
          console.log('token', keycloak.token)
          console.log('tokenParsed', keycloak.tokenParsed)
          setUsername(keycloak.tokenParsed?.preferred_username ?? '')
          loadNotes()
        }
      })
      .catch((e) => {
        setError(`Impossible de contacter Keycloak : ${e.message}`)
      })
      .finally(() => setInitialized(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!initialized) {
    return <p>Chargement de l'application...</p>
  }

  if (!authenticated) {
    return (
      <>
        <p>Non authentifié.</p>
        <button type="button" onClick={() => keycloak.login()}>
          Se connecter
        </button>
      </>
    )
  }

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1>Bonjour {username} 👋</h1>
        <button
          type="button"
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
        >
          Déconnexion
        </button>
      </header>

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}

      <h2>Mes notes</h2>
      {!error && notes.length === 0 && <p>Aucune note à afficher.</p>}
      {notes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Note</th>
              <th>Étudiant</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n, i) => (
              <tr key={i}>
                <td>{n.module}</td>
                <td>{n.note}</td>
                <td>{n.etudiant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default App
