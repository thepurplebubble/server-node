const requiredEnvVars = {
  REDIS_URL: "Port number for the server",
  PORT: "URL for the database connection",
};

function validateEnv() {
  const missingVars = Object.keys(requiredEnvVars).filter(
    (key) => !process.env[key],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}

validateEnv();

module.exports = {
  redisURL: process.env.REDIS_URL,
  port: process.env.PORT,
};
