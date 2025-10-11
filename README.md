# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [https://localhost:3030](https://localhost:3030) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).

## Local HTTPS Setup

### Generate local SSL certificates for development:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout localhost.key \
  -out localhost.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

### Download certificate

- Navigate to https://localhost:3030
- Click the "Not Secure" warning in address bar
- Click "Certificate" → "Details" → "Export"
- Import it into your system's trusted certificates

### Add certificate to trusted

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./localhost.pem
```
