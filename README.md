# TP Keycloak — OAuth 2.0 / OpenID Connect

Application de **gestion de demandes** sécurisée par Keycloak, avec :

- **Keycloak** comme serveur d'identité (OpenID Connect, flux *Authorization Code* + **PKCE**)
- **Spring Boot** comme *Resource Server* (validation des Access Tokens JWT)
- **React + Vite** comme client public

Un utilisateur `USER` crée et consulte ses demandes. Un utilisateur `ADMIN` consulte toutes les demandes et peut les valider ou les refuser.

---

## Architecture

| Composant | Technologie | Port |
|---|---|---|
| Serveur d'identité | Keycloak 26.x | `8080` |
| API sécurisée | Spring Boot 4 / Java 21 | `8081` |
| Frontend | React + Vite | `5173` |

Flux :

1. React redirige vers Keycloak (`login-required`)
2. Keycloak authentifie l'utilisateur et renvoie un code d'autorisation
3. Le client échange le code + PKCE (`S256`) contre des jetons
4. React envoie l'Access Token à Spring Boot (`Authorization: Bearer …`)
5. Spring Security valide le JWT et applique les règles de rôles
6. L'API renvoie les ressources autorisées

---

## Arborescence

```
tp_keyclock/
├── src/main/java/com/sid/tp_keyclock/
│   ├── config/securityConfig.java      # Resource Server + rôles + CORS
│   └── controller/DemandeController.java
├── src/main/resources/application.properties
├── frontend/
│   ├── src/keycloak.js                 # config du client Keycloak
│   ├── src/api.js                      # appels REST avec Bearer token
│   ├── src/App.jsx                     # interface demandes
│   └── vite.config.js                  # port 5173 strict
└── keycloak/
    ├── docker-compose.yml
    └── realm-enset.json                # realm importable
```

---

## Prérequis

- Docker
- Java 21
- Maven (ou le wrapper `./mvnw`)
- Node.js + npm

---

## 1. Démarrer Keycloak

```bash
cd keycloak
docker compose up -d
```

Le realm `enset-realm` est importé automatiquement depuis `realm-enset.json`.

Console d'administration : <http://localhost:8080> — `admin` / `admin`

> Le mode `start-dev` est réservé au TP local, jamais à la production.

### Configuration créée

- **Realm** : `enset-realm`
- **Client** : `react-client`
  - Client authentication : **Off** (client public)
  - Standard flow : On — Implicit flow : Off — Direct access grants : Off
  - Valid redirect URIs : `http://localhost:5173/*`
  - Web origins : `http://localhost:5173`
  - PKCE : **S256**
- **Rôles (realm)** : `USER`, `ADMIN`
- **Utilisateurs** :

| Utilisateur | Mot de passe | Rôles |
|---|---|---|
| `alice` | `alice123` | `USER` |
| `bob` | `bob123` | `USER`, `ADMIN` |

> ⚠️ Le scope client `basic` doit être présent dans les *default client scopes* du client.
> Il contient le mapper `sub` ; sans lui, le JWT n'a pas de claim `sub` et
> `jwt.getSubject()` renvoie `null` côté Spring.

---

## 2. Démarrer le backend

```bash
./mvnw spring-boot:run
```

Configuration (`application.properties`) :

```properties
server.port=8081
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/enset-realm
```

### Endpoints

| Méthode | Endpoint | Accès |
|---|---|---|
| `GET` | `/api/public` | public |
| `GET` | `/api/demandes` | `USER` ou `ADMIN` (ses demandes) |
| `POST` | `/api/demandes` | `USER` ou `ADMIN` (créer) |
| `GET` | `/api/admin/demandes` | `ADMIN` (toutes les demandes) |
| `PATCH` | `/api/admin/demandes/{id}` | `ADMIN` (statut `VALIDEE` / `REFUSEE`) |

Les rôles Keycloak (`realm_access.roles`) sont convertis en `ROLE_USER` / `ROLE_ADMIN`
par le `JwtAuthenticationConverter` de `securityConfig`.

---

## 3. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir <http://localhost:5173> : la redirection vers Keycloak est automatique.

---

## Tests de sécurité

```bash
# API publique
curl -i http://localhost:8081/api/public

# Sans token → 401
curl -i http://localhost:8081/api/demandes

# Récupérer un token (direct access grants désactivé sur react-client par défaut)
# Pour tester via Postman : activer temporairement "Direct access grants" sur le client,
# puis demander un token sur :
#   POST http://localhost:8080/realms/enset-realm/protocol/openid-connect/token

# Alice (USER) sur /api/admin/demandes → 403
# Bob   (ADMIN) sur /api/admin/demandes → 200
```

| Test | Attendu |
|---|---|
| `/api/public` sans token | `200` |
| `/api/demandes` sans token | `401` |
| Token invalide | `401` |
| `USER` sur `/api/admin/**` | `403` |
| `ADMIN` sur `/api/admin/**` | `200` |

---

## Notes

- Les demandes sont stockées **en mémoire** : elles disparaissent au redémarrage du backend.
- `keycloak-js` conserve les jetons en mémoire ; ne pas les stocker dans `localStorage`.
- Masquer le panneau d'administration dans React ne suffit pas : la protection réelle est côté Spring Security.
- Ne jamais committer de vrais Access Tokens ni de secrets.
