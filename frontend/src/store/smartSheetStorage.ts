import { create } from 'zustand';

// Define interfaces
export interface Cell {
  value: string;
}

export interface Column {
  id: string;
  name: string;
}

export interface Row {
  id: string;
  cells: { [columnId: string]: Cell };
}

export interface ActiveCell {
  rowIndex: number;
  columnId: string;
}

interface SpreadsheetState {
  columns: Column[];
  data: Row[];
  activeCell: ActiveCell | null;
  isProcessing: boolean;
  error: string | null;

  // Actions
  updateCell: (rowIndex: number, columnId: string, value: string) => void;
  addRow: () => void;
  addColumn: (columnName: string, sourceColumnIds?: string[], prompt?: string, toolType?: string) => void;
  deleteRow: (rowIndex: number) => void;
  deleteColumn: (columnId: string) => void;
  copyRow: (rowIndex: number) => void;
  copyColumn: (columnId: string) => void;
  generateWithLLM: (sourceColumnIds: string[], prompt: string, newColumnName: string, toolType?: string) => Promise<void>;
}

// Create unique IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// Initial state
const initialColumns: Column[] = [
  { id: 'col1', name: 'First Name' },
  { id: 'col2', name: 'Last Name' },
  { id: 'col3', name: 'Major' }
];

const initialData: Row[] = [
  {
    id: 'row1',
    cells: {
      col1: { value: 'John' },
      col2: { value: 'Doe' },
      col3: { value: 'Computer Science' }
    }
  },
  {
    id: 'row2',
    cells: {
      col1: { value: 'Jane' },
      col2: { value: 'Smith' },
      col3: { value: 'Mathematics' }
    }
  },
  {
    id: 'row3',
    cells: {
      col1: { value: 'Bob' },
      col2: { value: 'Johnson' },
      col3: { value: 'Physics' }
    }
  },
  {
    id: 'row4',
    cells: {
      col1: { value: 'Alice' },
      col2: { value: 'Williams' },
      col3: { value: 'Biology' }
    }
  }
];

// Create the store
export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  columns: initialColumns,
  data: initialData,
  activeCell: null,
  isProcessing: false,
  error: null,

  updateCell: (rowIndex, columnId, value) => {
    set((state) => {
      const newData = [...state.data];
      if (newData[rowIndex]) {
        newData[rowIndex] = {
          ...newData[rowIndex],
          cells: {
            ...newData[rowIndex].cells,
            [columnId]: { value }
          }
        };
      }
      return { data: newData };
    });
  },

  addRow: () => {
    set((state) => {
      const newRow: Row = {
        id: generateId(),
        cells: {}
      };

      // Initialize cells for all existing columns
      state.columns.forEach(column => {
        newRow.cells[column.id] = { value: '' };
      });

      return { data: [...state.data, newRow] };
    });
  },

  addColumn: (columnName, sourceColumnIds, prompt, toolType) => {
    const newColumnId = generateId();

    set((state) => {
      // Add new column to columns array
      const newColumns = [...state.columns, { id: newColumnId, name: columnName }];

      // Update all rows to include the new column
      const newData = state.data.map(row => ({
        ...row,
        cells: {
          ...row.cells,
          [newColumnId]: { value: '' }
        }
      }));

      return { columns: newColumns, data: newData };
    });

    // If source columns and prompt are provided, generate values with LLM
    if (sourceColumnIds && prompt) {
      get().generateWithLLM(sourceColumnIds, prompt, columnName, toolType);
    }
  },

  deleteRow: (rowIndex) => {
    set((state) => {
      const newData = [...state.data];
      if (rowIndex >= 0 && rowIndex < newData.length) {
        newData.splice(rowIndex, 1);
      }
      return { data: newData };
    });
  },

  deleteColumn: (columnId) => {
    set((state) => {
      // Remove column from columns array
      const newColumns = state.columns.filter(col => col.id !== columnId);

      // Remove column from all rows
      const newData = state.data.map(row => {
        const newCells = { ...row.cells };
        delete newCells[columnId];
        return {
          ...row,
          cells: newCells
        };
      });

      return { columns: newColumns, data: newData };
    });
  },

  copyRow: (rowIndex) => {
    set((state) => {
      if (rowIndex < 0 || rowIndex >= state.data.length) {
        return state;
      }

      // Create a copy of the row with a new ID
      const sourceRow = state.data[rowIndex];
      const newRow: Row = {
        id: generateId(),
        cells: { ...sourceRow.cells }
      };

      // Insert the copied row after the original
      const newData = [...state.data];
      newData.splice(rowIndex + 1, 0, newRow);

      return { data: newData };
    });
  },

  copyColumn: (columnId) => {
    set((state) => {
      const columnIndex = state.columns.findIndex(col => col.id === columnId);
      if (columnIndex === -1) {
        return state;
      }

      // Get source column
      const sourceColumn = state.columns[columnIndex];
      const newColumnId = generateId();
      const newColumnName = `${sourceColumn.name} (Copy)`;

      // Create new column
      const newColumns = [
        ...state.columns.slice(0, columnIndex + 1),
        { id: newColumnId, name: newColumnName },
        ...state.columns.slice(columnIndex + 1)
      ];

      // Copy data from source column to new column for all rows
      const newData = state.data.map(row => ({
        ...row,
        cells: {
          ...row.cells,
          [newColumnId]: { value: row.cells[columnId]?.value || '' }
        }
      }));

      return { columns: newColumns, data: newData };
    });
  },

  generateWithLLM: async (sourceColumnIds, prompt, newColumnName, toolType = "llm") => {
    set({ isProcessing: true, error: null });

    try {
      const state = get();

      // Prepare data in the required format
      const columnNames: string[] = [];
      const sourceData: { [key: string]: string[] } = {};

      // Initialize source data structure
      sourceColumnIds.forEach(columnId => {
        const column = state.columns.find(col => col.id === columnId);
        if (column) {
          columnNames.push(column.name);
          sourceData[column.name] = [];
        }
      });

      // Populate source data
      state.data.forEach(row => {
        sourceColumnIds.forEach(columnId => {
          const column = state.columns.find(col => col.id === columnId);
          if (column && row.cells[columnId]) {
            sourceData[column.name].push(row.cells[columnId].value);
          }
        });
      });

      // Prepare request payload
      const payload = {
        columnNames,
        sourceData,
        prompt,
        toolType
      };

      // Send request to backend using fetch instead of axios
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-column`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Update the store with generated values
      if (data && data.results) {
        const generatedValues = data.results;
        const targetColumnId = state.columns.find(col => col.name === newColumnName)?.id;

        if (targetColumnId && Array.isArray(generatedValues)) {
          // Update each row with the generated value
          state.data.forEach((_row, index) => {
            if (index < generatedValues.length) {
              // Extract the "response" field from the result object
              const responseValue = generatedValues[index].response || '';
              state.updateCell(index, targetColumnId, responseValue);
            }
          });
        }
      }

      set({ isProcessing: false });
    } catch (error) {
      console.error('Error generating values with LLM:', error);
      set({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to generate values'
      });
    }
  }
}));
