// src/app.ts
/*
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/router.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Bolnički sistem API radi!");
});

export default app;*/
// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/router.js";
import path from 'path';

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
//dotenv.config({ override: false });
const app = express();
//app.use(cors());
/*app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));*/
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "https://bolnicki-sistem-rezervacija.onrender.com/",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(express.json());

// Test-only middleware — aktivan SAMO u test okruženju
// Kad dodaš JWT, ovaj blok ostaje netaknut, dodaš JWT middleware ispod
if (process.env.NODE_ENV === "test") {
  app.use((req: any, res, next) => {
    const testKorisnikId = req.headers["x-test-korisnik-id"];
    if (testKorisnikId && !req.korisnik) {
      req.korisnik = { 
        id: Number(testKorisnikId),
        uloga: "PACIJENT"  // default za testove
      };
    }
    next();
  });
}

// TODO: kad implementiraš JWT, dodaj ovdje:
// app.use(jwtMiddleware);

// Produžen timeout za chat rutu — queue može čekati do 35s
app.use("/api/chat", (_req, res, next) => {
  res.setTimeout(60_000);
  next();
});

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Bolnički sistem API radi!");
});

/*
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
*/

// Socket.io setup za NFR-09
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "https://bolnicki-sistem-rezervacija.onrender.com/",
      "http://localhost:5173",
    ],
    credentials: true,
  },
});

// Error middleware — mora biti zadnji
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server error:", err);

  if (err.code === "P1001") {
    res.status(503).json({
      poruka: "Baza podataka nije dostupna. Provjerite DATABASE_URL i da li je PostgreSQL pokrenut.",
      kod: "DATABASE_UNAVAILABLE",
    });
    return;
  }

  if (err.code === "P2022") {
    res.status(500).json({
      poruka: "Baza nije uskladjena sa Prisma semom. Pokrenite Prisma migracije.",
      kod: "DATABASE_SCHEMA_OUT_OF_SYNC",
    });
    return;
  }

  const status = err.status || 500;
  const poruka = err.poruka || "Interna greska servera.";
  const odgovor: { poruka: string; kod?: string } = { poruka };
  if (typeof err.kod === "string") {
    odgovor.kod = err.kod;
  }
  res.status(status).json(odgovor);
});
export { io, httpServer };
export default app;
