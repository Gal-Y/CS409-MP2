import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getCharacterById,
  getCharacters,
  type MarvelCharacter,
} from '../api/marvel';
import './DetailView.css';

type CharacterSummary = {
  id: number;
  name: string;
};

interface DetailLocationState {
  neighbors?: CharacterSummary[];
}

type DetailData = {
  id: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  comics: string[];
  series: string[];
  events: string[];
  stories: string[];
};

const DEFAULT_POSTER =
  'https://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/portrait_uncanny.jpg';

const ensureHttps = (url: string) => (url.startsWith('http://') ? url.replace('http://', 'https://') : url);

const buildHeroImage = (thumbnail: MarvelCharacter['thumbnail'] | null): string => {
  if (!thumbnail?.path || thumbnail.path.includes('image_not_available')) {
    return DEFAULT_POSTER;
  }

  return `${ensureHttps(thumbnail.path)}/landscape_incredible.${thumbnail.extension}`;
};

const extractNames = (summary: { items: { name: string }[] }, limit = 6) => {
  return summary.items
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, limit);
};

const mapToDetail = (character: MarvelCharacter): DetailData => {
  return {
    id: character.id,
    name: character.name,
    description: character.description?.trim() || 'No description available.',
    thumbnailUrl: buildHeroImage(character.thumbnail),
    comics: extractNames(character.comics),
    series: extractNames(character.series),
    events: extractNames(character.events, 4),
    stories: extractNames(character.stories, 4),
  };
};

const DetailView: React.FC = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as DetailLocationState | null) ?? null;
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<CharacterSummary[]>(() => {
    if (locationState?.neighbors) {
      return [...locationState.neighbors];
    }
    return [];
  });

  useEffect(() => {
    if (locationState?.neighbors) {
      setNeighbors([...locationState.neighbors]);
    }
  }, [locationState]);

  useEffect(() => {
    if (!characterId) {
      return;
    }

    let cancelled = false;

    const loadCharacter = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCharacterById(characterId);
        if (!data) {
          throw new Error('Character not found');
        }

        if (cancelled) {
          return;
        }

        setDetail(mapToDetail(data));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError('Could not load character details.');
        setDetail(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCharacter();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    const hasCurrent = neighbors.some((item) => item.id === detail.id);
    if (hasCurrent) {
      return;
    }

    let cancelled = false;

    const loadNeighbors = async () => {
      try {
        const prefix = detail.name.trim().slice(0, 1) || 'A';
        const data = await getCharacters({ limit: 100, nameStartsWith: prefix, orderBy: 'name' });
        if (cancelled) {
          return;
        }

        const named = data.results
          .map((character) => ({ id: character.id, name: character.name }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const ensuresCurrent = named.some((item) => item.id === detail.id)
          ? named
          : [...named, { id: detail.id, name: detail.name }].sort((a, b) => a.name.localeCompare(b.name));

        setNeighbors(ensuresCurrent);
      } catch (err) {
        if (!cancelled) {
          setNeighbors([{ id: detail.id, name: detail.name }]);
        }
      }
    };

    loadNeighbors();

    return () => {
      cancelled = true;
    };
  }, [detail, neighbors]);

  const numericId = useMemo(() => Number(characterId), [characterId]);
  const currentIndex = neighbors.findIndex((item) => item.id === numericId);
  const previousCharacter = currentIndex > 0 ? neighbors[currentIndex - 1] : null;
  const nextCharacter = currentIndex >= 0 && currentIndex < neighbors.length - 1 ? neighbors[currentIndex + 1] : null;

  const handleNavigate = (id?: number) => {
    if (id) {
      navigate(`/detail/${id}`, { state: { neighbors } });
    }
  };

  return (
    <section className="detail-view">
      {loading && <div className="detail-view__status">Loading character...</div>}
      {error && <div className="detail-view__status detail-view__status--error">{error}</div>}

      {detail && !loading && (
        <>
          <div className="detail-view__hero">
            <img src={detail.thumbnailUrl} alt={detail.name} />
            <div className="detail-view__hero-info">
              <h2>{detail.name}</h2>
              <p>{detail.description}</p>
            </div>
          </div>

          <div className="detail-view__grid">
            <section>
              <h3>Comics</h3>
              {detail.comics.length > 0 ? (
                <ul>
                  {detail.comics.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p>No comics listed.</p>
              )}
            </section>

            <section>
              <h3>Series</h3>
              {detail.series.length > 0 ? (
                <ul>
                  {detail.series.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p>No series listed.</p>
              )}
            </section>

            <section>
              <h3>Events</h3>
              {detail.events.length > 0 ? (
                <ul>
                  {detail.events.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p>No events listed.</p>
              )}
            </section>

            <section>
              <h3>Stories</h3>
              {detail.stories.length > 0 ? (
                <ul>
                  {detail.stories.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              ) : (
                <p>No stories listed.</p>
              )}
            </section>
          </div>

          <div className="detail-view__nav">
            <button
              type="button"
              className="detail-view__nav-button"
              onClick={() => handleNavigate(previousCharacter?.id)}
              disabled={!previousCharacter}
            >
              Previous
            </button>
            <button
              type="button"
              className="detail-view__nav-button"
              onClick={() => handleNavigate(nextCharacter?.id)}
              disabled={!nextCharacter}
            >
              Next
            </button>
          </div>

          <div className="detail-view__back">
            <Link to="/gallery">Back to Gallery</Link>
          </div>
        </>
      )}
    </section>
  );
};

export default DetailView;
