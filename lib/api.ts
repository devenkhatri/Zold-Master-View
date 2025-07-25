export async function fetchSheetData() {
  try {
    const response = await fetch('/api/sheets');
    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to load data');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Example usage in a React component:
/*
  useEffect(() => {
    const loadData = async () => {
      try {
        const { owners, receipts, blockOptions, getFlatOptions } = await fetchSheetData();
        // Update your component state with the fetched data
      } catch (error) {
        // Handle error
      }
    };
    loadData();
  }, []);
*/
