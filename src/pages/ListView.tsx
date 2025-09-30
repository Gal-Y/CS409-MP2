import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCharacters,
  type CharacterSearchParams,
  type MarvelCharacter,
} from '../api/marvel';
import './ListView.css';

type SortKey = 'name-asc' | 'name-desc' | 'comics-desc' | 'comics-asc';

interface SortOption {
  label: string;
  value: SortKey;
  clientSort: (a: CharacterSummary, b: CharacterSummary) => number;
}

interface CharacterSummary {
  id: number;
  name: string;
  codename: string;
  thumbnailUrl: string;
  comics: number;
  events: number;
}

const DEFAULT_POSTER =
  'https://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/portrait_uncanny.jpg';
const API_DEBOUNCE_MS = 300;
const DISPLAY_LIMIT = 10;

const sortOptions: SortOption[] = [
  {
    label: 'Name A → Z',
    value: 'name-asc',
    clientSort: (a, b) => a.name.localeCompare(b.name),
  },
  {
    label: 'Name Z → A',
    value: 'name-desc',
    clientSort: (a, b) => b.name.localeCompare(a.name),
  },
  {
    label: 'Most Comics',
    value: 'comics-desc',
    clientSort: (a, b) => b.comics - a.comics,
  },
  {
    label: 'Fewest Comics',
    value: 'comics-asc',
    clientSort: (a, b) => a.comics - b.comics,
  },
];

const ensureHttps = (url: string) => (url.startsWith('http://') ? url.replace('http://', 'https://') : url);

const buildThumbnailUrl = (thumbnail: MarvelCharacter['thumbnail']): string => {
  if (!thumbnail?.path || thumbnail.path.includes('image_not_available')) {
    return DEFAULT_POSTER;
  }

  const basePath = ensureHttps(thumbnail.path);
  return `${basePath}/portrait_uncanny.${thumbnail.extension}`;
};

const summarizeCharacter = (character: MarvelCharacter): CharacterSummary => {
  const codename = character.series.items[0]?.name ?? 'Classified Asset';

  return {
    id: character.id,
    name: character.name,
    codename,
    thumbnailUrl: buildThumbnailUrl(character.thumbnail),
    comics: character.comics.available,
    events: character.events.available,
  };
};

const ListView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name-asc');
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CharacterSummary[]>>(new Map());

  const activeSort = useMemo(
    () => sortOptions.find((option) => option.value === sort) ?? sortOptions[0],
    [sort]
  );

  const neighborList = useMemo(
    () => characters.map((character) => ({ id: character.id, name: character.name })),
    [characters]
  );

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setCharacters([]);
      setError(null);
      setLoading(false);
      return;
    }

    const normalized = trimmed.toLowerCase();
    const cached = cacheRef.current.get(normalized);

    if (cached) {
      const sortedCached = [...cached].sort(activeSort.clientSort);
      setCharacters(sortedCached.slice(0, DISPLAY_LIMIT));
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const params: CharacterSearchParams = {
          limit: DISPLAY_LIMIT,
          nameStartsWith: trimmed,
        };

        const data = await getCharacters(params);
        if (cancelled) {
          return;
        }

        const mapped = data.results.map(summarizeCharacter);
        cacheRef.current.set(normalized, mapped);

        const sorted = [...mapped].sort(activeSort.clientSort);
        setCharacters(sorted.slice(0, DISPLAY_LIMIT));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError('Could not load characters right now. Please try again.');
        setCharacters([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, API_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, activeSort]);

  const showEmpty = !loading && !error && query.trim() !== '' && characters.length === 0;

  return (
    <section className="list-view">
      <h2 className="list-view__title">Marvel Character Search</h2>
      <p className="list-view__hint">Start typing a name to look someone up.</p>

      <div className="list-view__controls">
        <input
          type="search"
          placeholder="Search for a character"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="list-view__input"
          aria-label="Search characters"
        />

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="list-view__select"
          aria-label="Sort characters"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="list-view__status">Loading...</div>}
      {error && <div className="list-view__status list-view__status--error">{error}</div>}
      {showEmpty && <div className="list-view__status">No characters found for that search.</div>}

      <ul className="list-view__results">
        {characters.map((character) => (
          <li key={character.id} className="list-view__item">
            <Link
              to={`/detail/${character.id}`}
              className="list-view__link"
              state={{ neighbors: neighborList }}
            >
              <img
                src={character.thumbnailUrl}
                alt={character.name}
                className="list-view__thumb"
                loading="lazy"
              />
              <div className="list-view__info">
                <h3>{character.name}</h3>
                <p>Alias: {character.codename}</p>
                <p>
                  Comics: {character.comics.toLocaleString()} | Events: {character.events}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ListView;
