# Purple Bubble Server

[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

Purple Bubble Server is a Node.js implementation of a decentralized, secure messaging system designed to provide anonymity and security for its users.

## Features

- Decentralized mesh network of servers
- RSA 4096 encryption for message security
- Separate transmission (TX) and reception (RX) servers for enhanced anonymity
- Message retention for 7 days
- Automatic server and message synchronization

## Prerequisites

- Node.js (v14 or later recommended)
- Redis server

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/thepurplebubble/server-node.git
   ```

2. Navigate to the project directory:

   ```
   cd server-node
   ```

3. Install dependencies:

   ```
   npm install
   ```

   or with Yarn:

   ```
   yarn install
   ```

4. Create a `.env` file in the root directory with the following content:
   ```
   PORT=8080
   REDIS_URL=redis://localhost:6379
   ```
   Adjust these values as needed for your environment.

## Development

To start the server in development mode, run the dev script:

```
yarn dev
```

## Usage

To start the server (Production mode):

Run the build script with your favorite package manager:

```
yarn build
```

Then start the server using node:

```
node dist/index.js
```

The server will start and listen on the port specified in your `.env` file.

## API Endpoints

- `/fetch` (POST): Retrieve messages for a recipient
- `/send` (POST): Send a new message
- `/sync/servers` (POST): Synchronize known servers list
- `/sync/hashes` (POST): Synchronize message hashes

For detailed API documentation, please refer to the [API Documentation](docs/API.md) (TODO: Create this document).

## Contributing

We welcome contributions to the Purple Bubble Server project! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Contact

For bug reports and feature requests, please use the [GitHub Issues](https://github.com/thepurplebubble/server-node/issues) page.

For other inquiries, please reach out to [project maintainer's email] (TODO: Add contact email).

---

Purple Bubble Server is part of the Purple Bubble project, aiming to provide secure and anonymous communication for all.
