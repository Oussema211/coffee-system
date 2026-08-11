# Free Forever Deployment — No Credit Card Needed
## Coffee Shop System: Admin Dashboard + Customer QR Ordering

**Stack:** Cloudflare Pages (frontend) + Render (backend) + Supabase (database) + UptimeRobot (keep-alive)
**Cost:** $0/month, forever, no card required anywhere in this stack
**Trade-off handled:** Render normally sleeps after 15 min idle — the keep-alive ping (Part 5) keeps it warm so customers scanning the QR code don't hit a cold start.

---

## Architecture

```
Customer scans QR → Cloudflare Pages (Angular) → Render (Spring Boot API) → Supabase (Postgres)
Admin logs in     ↗                                       ↑
Local shop POS ───────────────────────────────────────────┘ (same API, just another client)

UptimeRobot pings Render every 5 min, 24/7, to keep it awake
```

---

## Part 1 — Database: Supabase (no card)

1. supabase.com → Sign in with GitHub (no card, no payment info anywhere in this flow).
2. New Project → set a strong DB password → pick a region close to Europe (Render's free EU region if you use one, or closest to Tunisia).
3. Wait ~2 min for provisioning.
4. Project Settings → Database → Connection Pooling → copy the **Session pooler** connection string (port 5432 or 6543). Use the pooler, not the direct connection — Render can't reach Supabase's direct IPv6-only endpoint.

Your Spring Boot `application-prod.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://<POOLER_HOST>:6543/postgres?sslmode=require
    username: postgres.<project-ref>
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

**Important:** Supabase pauses the whole project after 7 days of zero activity. The keep-alive ping in Part 5 also solves this — as long as something's hitting your backend regularly, Supabase stays active too.

---

## Part 2 — Backend: Spring Boot on Render (no card)

### 2.1 Dockerfile (repo root)

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-Xmx400m", "-Xss256k", "-XX:+UseSerialGC", "-jar", "app.jar"]
```

### 2.2 Deploy

1. Push to GitHub.
2. render.com → sign up with GitHub (no card).
3. New → Web Service → connect your repo.
4. Environment: Docker (auto-detected). Instance type: **Free**.
5. Add env vars: `DB_PASSWORD`, `SPRING_PROFILES_ACTIVE=prod`, Supabase pooler host/user.
6. Deploy — you get `https://yourapp.onrender.com`.
7. Confirm `https://yourapp.onrender.com/actuator/health` responds (add Spring Actuator dependency if you haven't).

### 2.3 CORS

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                .allowedOrigins("https://yourapp.pages.dev")
                .allowedMethods("GET","POST","PUT","DELETE","OPTIONS");
        }
    };
}
```

---

## Part 3 — Frontend: Angular on Cloudflare Pages (no card)

1. `environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://yourapp.onrender.com'
};
```
2. Push to GitHub.
3. Cloudflare dashboard (sign up free, no card) → Workers & Pages → Create → Pages → connect repo.
4. Build command: `npm run build`. Output directory: `dist/<project-name>/browser` (check your Angular version's actual output path).
5. Deploy → you get `https://yourapp.pages.dev` free.
6. Add `_redirects` file for Angular routing:
```
/*    /index.html   200
```

---

## Part 4 — Customer QR ordering flow

1. Each table's QR encodes: `https://yourapp.pages.dev/order?table=5`
2. Generate QR codes free (any online QR generator, or the `qrcode` npm package) — print and place on tables.
3. Angular `/order` route reads `table` from the query param, shows the menu, posts to `/api/orders` with the table number.
4. Local shop POS hits the same backend (`/api/orders?status=pending`) — it's just another client of your API, no special setup needed, works over normal internet.

---

## Part 5 — Keep-alive ping (this is what makes Render usable for customers)

Without this, Render sleeps after 15 min idle and the next customer scan takes 30-50s to load. With a ping every 5 min, it almost never sleeps.

1. Go to **uptimerobot.com** → sign up free (no card).
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://yourapp.onrender.com/actuator/health`
   - Monitoring Interval: **5 minutes** (free plan allows this)
3. Save. UptimeRobot now pings your backend 24/7, keeping it warm.
4. Bonus: UptimeRobot also emails/texts you if your backend ever actually goes down — free monitoring on top of the keep-alive trick.

This isn't bypassing any rule — it's a standard, widely-used pattern for free-tier apps that need to stay responsive.

---

## Part 6 — Order of operations

1. Supabase project + pooler connection string
2. Spring Boot connects locally to Supabase, confirm it works
3. Push Dockerfile, deploy to Render, confirm `/actuator/health` responds
4. Set up UptimeRobot ping immediately — don't wait, this is what keeps everything alive including Supabase
5. Angular `environment.prod.ts` → Render URL, deploy to Cloudflare Pages
6. Update CORS on backend to your real `.pages.dev` URL
7. Generate QR codes pointing at `/order?table=N`
8. Test full flow: scan QR on your phone → order → check it appears via the API for your local POS to pick up

---

## What's genuinely free here, no exceptions

| Piece | Cost | Card needed? |
|---|---|---|
| Supabase Postgres | $0 forever | No |
| Render backend | $0 forever | No |
| Cloudflare Pages frontend | $0 forever | No |
| UptimeRobot monitoring | $0 forever | No |
| `.pages.dev` / `.onrender.com` URLs | $0 forever | No |

No domain cost either — you don't need one, `yourapp.pages.dev` is a real, working HTTPS URL you can print on QR codes and share with your admin.

## Honest limitation that remains

Even with the keep-alive ping, there's a small chance of a slow load if UptimeRobot's ping and a real customer request land in the same narrow gap right as it's waking up — rare, but not impossible. For a small shop's actual order volume, this setup holds up fine. If the business grows to the point where even rare slowness costs you real orders, that's the point to revisit a real VPS — by then you'll likely have a card or the revenue to justify $5/month anyway.
