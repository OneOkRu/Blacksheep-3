import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RatingData } from '../types';
import { recalculateEloRatings } from '../lib/eloCalculator';

interface DataContextType {
  data: RatingData | null;
  loading: boolean;
  error: string | null;
  updateData: (newData: RatingData) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if there's a draft in localStorage (for admin preview)
        const draft = localStorage.getItem('rating_data_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          const recalculated = recalculateEloRatings(parsed);
          setData(recalculated);
          setLoading(false);

          // Silently sync browser's recalculated layout to server disk
          fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recalculated)
          }).catch(err => console.error('Silent sync failed:', err));

          return;
        }

        const response = await fetch('/data/rating.json');
        if (!response.ok) {
          throw new Error('Failed to load rating data');
        }
        const jsonData = await response.json();
        setData(recalculateEloRatings(jsonData));
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateData = useCallback((newData: RatingData) => {
    const recalculated = recalculateEloRatings(newData);
    setData(recalculated);
    localStorage.setItem('rating_data_draft', JSON.stringify(recalculated));

    // Also persist data directly to disk to update public/data/rating.json on the server
    fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recalculated),
    })
      .then((res) => {
        if (!res.ok) {
          console.error('Failed to update rating.json on server disk');
        } else {
          console.log('Successfully saved recalculated rating.json to server disk.');
        }
      })
      .catch((err) => {
        console.error('Error saving rating.json to disk:', err);
      });
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
