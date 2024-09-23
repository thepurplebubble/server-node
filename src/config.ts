const requiredEnvVars = {
  REDIS_URL: "URL for the database connection",
  PORT: "Port number for the server",
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
