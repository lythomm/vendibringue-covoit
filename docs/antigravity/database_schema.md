# Database Schema - VendiBringue Covoit'

Ce document définit la structure de la base de données PostgreSQL hébergée sur Supabase.

## Diagramme des Relations (Mermaid)

```mermaid
erDiagram
    profiles ||--o{ rides : "conduit"
    profiles ||--o{ bookings : "réserve"
    events ||--o{ rides : "accueille"
    rides ||--o{ bookings : "contient"

    events {
        uuid id PK
        text name
        text short_code "Code d'accès"
        float8 center_lat
        float8 center_lng
        text address
        timestamp created_at
    }

    profiles {
        uuid id PK "Ref auth.users"
        text first_name
        text phone "Invisible par défaut"
        text instagram_id "Optionnel"
        text pin_hash "Haché pour sécurité"
        text avatar_url
        timestamp updated_at
    }

    rides {
        uuid id PK
        uuid event_id FK "Ref events.id"
        uuid driver_id FK "Ref profiles.id"
        text origin_name "Nom du lieu (ex: Mairie)"
        float8 origin_lat
        float8 origin_lng
        int total_seats
        text description
        timestamp departure_time
        text status "active, cancelled, completed"
        timestamp created_at
    }

    bookings {
        uuid id PK
        uuid ride_id FK "Ref rides.id"
        uuid passenger_id FK "Ref profiles.id"
        text status "confirmed, cancelled"
        timestamp created_at
    }
```

## Tables de Référence

### `profiles`
Contient l'identité simplifiée des "Bringueurs".
- **Identité** : Liée à `auth.users` de Supabase.
- **Sécurité** : Le numéro de téléphone n'est pas public tant qu'un covoiturage n'est pas validé.

### `rides` (Trajets)
Les offres de covoiturage proposées par les conducteurs.
- `origin_lat/lng` : Points GPS pour l'affichage sur la carte.
- `total_seats` : Maximum de passagers autorisés.

### `bookings` (Réservations)
Jointure entre un passager et un trajet.
- **Contrainte** : Un passager ne peut pas réserver deux fois le même trajet.

## Vues Spéciales
- **`ride_details`** : Calcule automatiquement le nombre de `remaining_seats` en soustrayant les bookings confirmés du total des places.

## Sécurité (RLS)
Des politiques de Row Level Security (RLS) sont actives pour garantir que :
1. Les utilisateurs ne voient les numéros de téléphone que s'ils font partie du même trajet.
2. Seul le conducteur d'un trajet peut le modifier ou l'annuler.
