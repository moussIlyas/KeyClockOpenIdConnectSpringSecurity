import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: 'enset-realm',
    clientId: ''
});

await keycloak.init({ onLoad: 'login-required' });