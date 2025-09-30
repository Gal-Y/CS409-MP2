import React from 'react';
import { useParams } from 'react-router-dom';

const DetailView: React.FC = () => {
  const { characterId } = useParams();

  return (
    <section className="view view--detail">
      <header className="view-header">
        <h2>Character Detail</h2>
        <p>Showing data for ID: {characterId}</p>
      </header>
      <p className="view-placeholder">Character profile, comics, and navigation controls coming soon…</p>
    </section>
  );
};

export default DetailView;
