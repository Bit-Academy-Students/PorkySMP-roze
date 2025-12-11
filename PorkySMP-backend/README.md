# 🌍 Landen Claim API

Deze API beheert gebruikers, spelersinformatie en teams. De architectuur maakt gebruik van Laravel Sanctum voor authenticatie en implementeert Role-Based Access Control (RBAC) op zowel het algemene gebruikersniveau (`admin`/`user`) als het teamniveau (`leader`/`mod`/`member`).

## 🔑 Authenticatie (Publieke Routes)

Deze endpoints zijn publiekelijk toegankelijk voor registratie en inloggen.

| Methode | Endpoint | Controller/Actie | Beschrijving |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | `AuthController@register` | Registreer een nieuwe gebruiker. Maakt automatisch een `PlayerInfo` record aan. |
| `POST` | `/api/login` | `AuthController@login` | Log in en ontvang een Sanctum Bearer Token. Registreert ook de `first_login` datum/tijd indien nodig. |

---

## 🛡️ Beveiligde Routes (Vereist `auth:sanctum`)

Alle onderstaande routes vereisen dat een geldige `Authorization: Bearer <token>` header wordt meegestuurd.

### 🔒 Algemene Auth & PlayerInfo

| Methode | Endpoint | Controller/Actie | Vereisten/Opmerkingen |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/logout` | `AuthController@logout` | Log de gebruiker uit door de huidige token te verwijderen. |
| `POST` | `/api/player-info` | `PlayerInfoController@storeOrUpdate` | Maak of werk de `skin_url` van de ingelogde gebruiker bij. |

### 👥 Gebruikers (Lezen & Beheer)

#### Publieke Lijst (Gefilterd)
| Methode | Endpoint | Controller/Actie | Vereisten/Opmerkingen |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `UserController@index` | Haalt alle gebruikers op. **Belangrijk**: Data wordt gefilterd. Normale gebruikers zien alleen `username` en teamrollen. Admins zien alle velden (`email`, `role`). |

#### Admin Beheer (Vereist Middleware `role:admin`)
Deze routes zijn beveiligd met de `CheckUserRole` middleware.

| Methode | Endpoint | Controller/Actie | Vereisten/Opmerkingen |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/{user}` | `UserController@show` | Toon specifieke gebruiker (Admin ziet alle verborgen velden). |
| `PUT` | `/api/users/{user}` | `UserController@update` | Werk gebruikersgegevens bij (bijv. `username`, `email`, `role`, `password`). |
| `DELETE` | `/api/users/{user}` | `UserController@destroy` | Verwijder een gebruiker. |

---

## 🚩 Team Endpoints

### 📖 Publieke Team Leesacties (Geen Auth)

| Methode | Endpoint | Controller/Actie | Beschrijving |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams` | `TeamController@index` | Haal alle teams op, inclusief leden en de `leader` computed property. |
| `GET` | `/api/teams/{team}` | `TeamController@show` | Haal één specifiek team op, inclusief leden en de `leader` computed property. |

### 🛠️ Beveiligde Team Management (Vereist `auth:sanctum`)

| Methode | Endpoint | Controller/Actie | Vereisten/Opmerkingen |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/teams` | `TeamController@store` | Maak een nieuw team aan. De aanvrager wordt automatisch de **Leader**. |
| `PUT` | `/api/teams/{team}` | `TeamController@update` | Werk teamdetails bij (`team_name`, `description`, etc.). **Autorisatie**: Alleen toegestaan voor de **Leader** van het team. |
| `DELETE` | `/api/teams/{team}` | `TeamController@destroy` | Verwijder een team. **Autorisatie**: Alleen toegestaan voor de **Leader** van het team. |
| `POST` | `/api/teams/{team}/members/{user}/attach` | `TeamController@attachUser` | Voeg een gebruiker toe of werk de rol (`member`, `mod`, `leader`) van een lid bij. **Autorisatie**: Alleen toegestaan voor de **Leader** of een **Mod**. Regelt de **leiderschapsoverdracht** (de oude leader wordt gedowngrade naar `mod`). |
| `DELETE` | `/api/teams/{team}/members/{user}/detach` | `TeamController@detachUser` | Verwijder een gebruiker uit het team. **Autorisatie**: Alleen toegestaan voor de **Leader** of een **Mod**. De leider kan zichzelf niet verwijderen. |