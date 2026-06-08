// Vercel Serverless polyfills for pdf-parse
global.DOMMatrix = global.DOMMatrix || class DOMMatrix {};
global.ImageData = global.ImageData || class ImageData {};
global.Path2D = global.Path2D || class Path2D {};

const { createApp } = require('../backend/src/app');
const { connectDb } = require('../backend/src/config/db');
const { env } = require('../backend/src/config/env');

// Connect to MongoDB
let isConnected = false;

const app = createApp();

// Wrap the Express app for Vercel
module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDb(env.MONGODB_URI);
    isConnected = true;
  }
  
  // Let Express handle the request
  return app(req, res);
};
