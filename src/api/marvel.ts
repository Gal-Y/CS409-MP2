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

type AuthParamValue = string | number | boolean | undefined;

const withAuthParams = (params: Record<string, AuthParamValue> = {}) => {
  if (!publicKey || !privateKey) {
    throw new Error('Marvel API credentials are missing. Double-check .env.local.');
  }

  const ts = Date.now().toString();
  const hash = CryptoJS.MD5(ts + privateKey + publicKey).toString();

  return {
    ...params,
    ts,
    apikey: publicKey,
    hash,
  };
};

export interface MarvelImage {
  path: string;
  extension: string;
}

export interface MarvelUrl {
  type: string;
  url: string;
}

export interface MarvelResourceSummary {
  resourceURI: string;
  name: string;
}

export interface MarvelStorySummary extends MarvelResourceSummary {
  type?: string;
}

export interface MarvelResourceList<TItem extends MarvelResourceSummary = MarvelResourceSummary> {
  available: number;
  returned: number;
  collectionURI: string;
  items: TItem[];
}

export interface MarvelCharacter {
  id: number;
  name: string;
  description: string;
  modified: string;
  resourceURI: string;
  thumbnail: MarvelImage | null;
  comics: MarvelResourceList;
  series: MarvelResourceList;
  stories: MarvelResourceList<MarvelStorySummary>;
  events: MarvelResourceList;
  urls: MarvelUrl[];
}

export interface MarvelComic {
  id: number;
  title: string;
  description: string;
  issueNumber: number;
  thumbnail: MarvelImage | null;
  resourceURI: string;
}

export interface MarvelDataContainer<T> {
  offset: number;
  limit: number;
  total: number;
  count: number;
  results: T[];
}

export interface MarvelApiResponse<T> {
  code: number;
  status: string;
  data: MarvelDataContainer<T>;
  etag: string;
}

export type CharacterOrderBy = 'name' | '-name' | 'modified' | '-modified';

export interface CharacterSearchParams extends Record<string, AuthParamValue> {
  nameStartsWith?: string;
  orderBy?: CharacterOrderBy;
  limit?: number;
  offset?: number;
}

export const getCharacters = async (
  params: CharacterSearchParams = {}
): Promise<MarvelDataContainer<MarvelCharacter>> => {
  const response = await client.get<MarvelApiResponse<MarvelCharacter>>('/characters', {
    params: withAuthParams(params),
  });

  return response.data.data;
};

export const getCharacterById = async (id: string | number): Promise<MarvelCharacter | null> => {
  const response = await client.get<MarvelApiResponse<MarvelCharacter>>(`/characters/${id}`, {
    params: withAuthParams(),
  });

  return response.data.data.results[0] ?? null;
};

export const getComics = async (
  params: Record<string, AuthParamValue> = {}
): Promise<MarvelDataContainer<MarvelComic>> => {
  const response = await client.get<MarvelApiResponse<MarvelComic>>('/comics', {
    params: withAuthParams(params),
  });

  return response.data.data;
};
