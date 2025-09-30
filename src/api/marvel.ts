import axios from 'axios';
import CryptoJS from 'crypto-js';

const publicKey = process.env.REACT_APP_MARVEL_PUBLIC_KEY ?? '';
const privateKey = process.env.REACT_APP_MARVEL_PRIVATE_KEY ?? '';
const baseURL = 'https://gateway.marvel.com/v1/public';

if (!publicKey || !privateKey) {
  // Helps catch missing env vars early during development.
  // eslint-disable-next-line no-console
  console.warn('Marvel API keys are not set in .env.local');
}

const client = axios.create({ baseURL });

const withAuthParams = (params: Record<string, unknown> = {}) => {
  const ts = Date.now().toString();
  // Hashing the keys
  const hash = CryptoJS.MD5(ts + privateKey + publicKey).toString();

  return {
    ...params,
    ts,
    apikey: publicKey,
    hash,
  };
};

export const getCharacters = async (params: Record<string, unknown> = {}) => {
  const response = await client.get('/characters', {
    params: withAuthParams(params),
  });
  return response.data;
};

export const getCharacterById = async (id: string | number) => {
  const response = await client.get(`/characters/${id}`, {
    params: withAuthParams(),
  });
  return response.data;
};

export const getComics = async (params: Record<string, unknown> = {}) => {
  const response = await client.get('/comics', {
    params: withAuthParams(params),
  });
  return response.data;
};
