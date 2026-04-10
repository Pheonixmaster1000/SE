require("./lib/config");

const path = require("path");
const express = require("express");
const session = require("express-session");
const morgan = require("morgan");
const { SESSION_SECRET, PORT } = require("./lib/config");
const logger = require("./lib/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const rateLimits = require("./middleware/rateLimits");
const { startAuctionScheduler } = require("./lib/scheduler");
const db = require("./lib/db");
const store = require("./lib/store");

const authRoutes = require("./routes/auth");
const { router: auctionRoutes } = require("./routes/auctions");
const ticketRoutes = require("./routes/tickets");
const adminRoutes = require("./routes/admin");

const app = express();

app.disable("x-powered-by");
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "512kb" }));
app.use(
  session({
    name: "auction.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

function ensureDataFiles() {
  const fs = require("fs");
  const usersPath = path.join(db.dataDir, store.USERS);
  if (!fs.existsSync(usersPath)) {
    logger.warn("No data/users.json — run: npm run seed");
  }
}

app.use("/api", rateLimits.apiGlobal);

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

ensureDataFiles();
startAuctionScheduler();

app.listen(PORT, () => {
  logger.info(`Auction Hub running at http://localhost:${PORT}`);
});
