import axios from "axios";
import { Log } from "../../logging_middleware/logger.js";

const AUTH_BASE = "http://4.224.186.213/evaluation-service";

const CREDENTIALS = {
  email: "naveensekhar06@gmail.com",
  name: "naveen_sekhar",
  rollNo: "e0223006",
  accessCode: "DvwEDZ",
  clientID: "765cbde2-f660-4845-8b50-dc706c7ee9c5",
  clientSecret: "EYZJndjsuSUyMPBs",
};

let accessToken = null;
let tokenExpiry = 0;

// one-time registration (already done, don't call again)
export async function register() {
  try {
    const response = await axios.post(`${AUTH_BASE}/register`, {
      email: "e0223006@sriher.edu.in",
      name: "naveen_sekhar",
      mobileNo: "8072635093",
      githubUsername: "naveen-sekhar",
      rollNo: "E0223006",
      accessCode: "DvwEDZ",
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error(`Registration failed: ${msg}`);
    throw error;
  }
}

// gets a bearer token, caches it, auto-refreshes when expired
export async function authenticate() {
  if (accessToken && Date.now() < (tokenExpiry - 60000)) {
    return accessToken;
  }

  try {
    const response = await axios.post(`${AUTH_BASE}/auth`, CREDENTIALS);

    const { access_token, expires_in } = response.data;
    if (!access_token) {
      throw new Error("Auth response missing access_token");
    }

    accessToken = access_token;
    tokenExpiry = expires_in * 1000;

    console.log("✅ Authentication successful, token acquired");
    return accessToken;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error(`Authentication failed: ${msg}`);
    throw error;
  }
}

export async function getToken() {
  return authenticate();
}
