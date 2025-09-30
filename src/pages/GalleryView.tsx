import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCharacters,
  type MarvelCharacter,
} from '../api/marvel';
import './GalleryView.css';

type ActivityLevel = 'legend' | 'veteran' | 'rookie';

type GalleryCharacter = {
  id: number;
  name: string;
  thumbnailUrl: string;
  comics: number;
  events: number;
  activity: ActivityLevel;
  series: string[];
};

const DEFAULT_POSTER =
  'https://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/portrait_uncanny.jpg';

const activityFilters: { label: string; value: ActivityLevel }[] = [
  { label: 'Legends (1000+ comics)', value: 'legend' },
  { label: 'Veterans (200-999)', value: 'veteran' },
  { label: 'Rising Heroes (<200)', value: 'rookie' },
];

const ensureHttps = (url: string) => (url.startsWith('http://') ? url.replace('http://', 'https://') : url);

const buildThumbnailUrl = (thumbnail: MarvelCharacter['thumbnail'] | null): string => {
  if (!thumbnail?.path || thumbnail.path.includes('image_not_available')) {
    return DEFAULT_POSTER;
  }

  return `${ensureHttps(thumbnail.path)}/standard_fantastic.${thumbnail.extension}`;
};

const classifyActivity = (comicCount: number): ActivityLevel => {
  if (comicCount >= 1000) {
    return 'legend';
  }

  if (comicCount >= 200) {
    return 'veteran';
  }

  return 'rookie';
};

const pickSeries = (character: MarvelCharacter): string[] => {
  return character.series.items
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 5);
};

const mapToGalleryCharacter = (character: MarvelCharacter): GalleryCharacter => {
  const comics = character.comics.available;
  return {
    id: character.id,
    name: character.name,
    thumbnailUrl: buildThumbnailUrl(character.thumbnail),
    comics,
    events: character.events.available,
    activity: classifyActivity(comics),
    series: pickSeries(character),
  };
};

const GalleryView: React.FC = () => {
  const [characters, setCharacters] = useState<GalleryCharacter[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Set<ActivityLevel>>(new Set());
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [seriesFilters, setSeriesFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCharacters({ limit: 100, orderBy: '-modified' });
        const mapped = data.results.map(mapToGalleryCharacter);

        const frequency = new Map<string, number>();
        mapped.forEach((hero) => {
          hero.series.forEach((seriesName) => {
            frequency.set(seriesName, (frequency.get(seriesName) ?? 0) + 1);
          });
        });

        const sortedSeries = Array.from(frequency.entries())
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name]) => name);

        setCharacters(mapped);
        setSeriesFilters(sortedSeries);
      } catch (err) {
        setError('Unable to load gallery right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleActivity = (value: ActivityLevel) => {
    setSelectedActivity((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleSeries = (seriesName: string) => {
    setSelectedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesName)) {
        next.delete(seriesName);
      } else {
        next.add(seriesName);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedActivity(new Set());
    setSelectedSeries(new Set());
  };

  const filteredCharacters = useMemo(() => {
    return characters.filter((character) => {
      const activityOk =
        selectedActivity.size === 0 || selectedActivity.has(character.activity);
      const seriesOk =
        selectedSeries.size === 0 || character.series.some((seriesName) => selectedSeries.has(seriesName));

      return activityOk && seriesOk;
    });
  }, [characters, selectedActivity, selectedSeries]);

  const neighborList = useMemo(
    () => filteredCharacters.map((character) => ({ id: character.id, name: character.name })),
    [filteredCharacters]
  );

  return (
    <section className="gallery-view">
      <header className="gallery-view__header">
        <div>
          <h2>Character Gallery</h2>
          <p>Flip through recent Marvel characters and filter by activity or series ties.</p>
        </div>
        <button type="button" className="gallery-view__reset" onClick={clearFilters}>
          Clear filters
        </button>
      </header>

      <div className="gallery-view__filters">
        <div className="gallery-view__filter-group">
          <span className="gallery-view__filter-label">Activity</span>
          <div className="gallery-view__filter-options">
            {activityFilters.map((option) => {
              const isActive = selectedActivity.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`gallery-view__chip${isActive ? ' gallery-view__chip--active' : ''}`}
                  onClick={() => toggleActivity(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {seriesFilters.length > 0 && (
          <div className="gallery-view__filter-group">
            <span className="gallery-view__filter-label">Popular Series</span>
            <div className="gallery-view__filter-options">
              {seriesFilters.map((seriesName) => {
                const isActive = selectedSeries.has(seriesName);
                return (
                  <button
                    key={seriesName}
                    type="button"
                    className={`gallery-view__chip${isActive ? ' gallery-view__chip--active' : ''}`}
                    onClick={() => toggleSeries(seriesName)}
                  >
                    {seriesName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading && <div className="gallery-view__status">Loading gallery...</div>}
      {error && <div className="gallery-view__status gallery-view__status--error">{error}</div>}
      {!loading && filteredCharacters.length === 0 && !error && (
        <div className="gallery-view__status">No characters match the current filters.</div>
      )}

      <div className="gallery-view__grid">
        {filteredCharacters.map((character) => (
          <Link
            key={character.id}
            to={`/detail/${character.id}`}
            className="gallery-view__card"
            state={{ neighbors: neighborList }}
          >
            <img src={character.thumbnailUrl} alt={character.name} loading="lazy" />
            <div className="gallery-view__card-body">
              <h3>{character.name}</h3>
              <p className="gallery-view__card-meta">
                Comics: {character.comics.toLocaleString()} | Events: {character.events}
              </p>
              {character.series.length > 0 && (
                <ul className="gallery-view__series">
                  {character.series.slice(0, 3).map((seriesName) => (
                    <li key={seriesName}>{seriesName}</li>
                  ))}
                </ul>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GalleryView;
