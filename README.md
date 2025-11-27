# All You Can Gym

## Description
A mobile app offering access to a wide network of partner gyms through subscription packages. Book sessions, track progress, and connect with friends for a fun, social fitness experience—anytime, anywhere.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/vic5678/Team-13-All-You-Can-Gym-Backend.git
   ```
2. Navigate to the project directory:
   ```
   cd all-you-can-gym
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

## Usage
1. Start the development:
   ```
   npm run dev
   ```
2. The server will run on `http://localhost:3000` by default.

## API Endpoints
The OpenApi swagger file can be found here [`docs/swagger.yaml`](docs/swagger.yaml)

## Environment Variables
- `MONGO_URI`: MongoDB connection string. Leave blank to use the hardcoded mockdata.
- `PORT`: Port number for the server (default is 3000).
- `JWT_SECRET`: Secret key for JWT authentication.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
