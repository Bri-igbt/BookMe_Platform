import client from "./client.js";

export const getGoogleConnectUrl = () => client.get('/integrations/google/connect');