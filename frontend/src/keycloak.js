import Keycloak from 'keycloak-js'

// Config alignée sur application.properties du backend :
//  - Keycloak tourne sur http://localhost:8080, realm "enset-realm"
//  - Le clientId doit correspondre au client créé dans Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'enset-realm',
  clientId: 'tp-frontend',
})

export default keycloak
