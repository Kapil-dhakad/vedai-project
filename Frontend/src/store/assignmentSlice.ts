import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Assignment, AssignmentFormData, QuestionPaper, DEFAULT_QUESTION_TYPES } from '@/types';
import { assignmentApi } from '@/services/api';

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  currentPaper: QuestionPaper | null;
  generationStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  generationProgress: number;
  generationMessage: string;
  formData: AssignmentFormData;
  formStep: 1 | 2;
  loading: boolean;
  papersLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialFormData: AssignmentFormData = {
  title: '',
  subject: '',
  grade: '',
  schoolName: 'Delhi Public School, Bokaro',
  dueDate: '',
  questionTypes: DEFAULT_QUESTION_TYPES,
  additionalInstructions: '',
  file: null,
};

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  currentPaper: null,
  generationStatus: 'idle',
  generationProgress: 0,
  generationMessage: '',
  formData: initialFormData,
  formStep: 1,
  loading: false,
  papersLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
};

export const fetchAssignments = createAsyncThunk(
  'assignment/fetchAll',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      return await assignmentApi.getAll(page);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchAssignment = createAsyncThunk(
  'assignment/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await assignmentApi.getById(id);
      return res.data!;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchPaper = createAsyncThunk(
  'assignment/fetchPaper',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await assignmentApi.getPaper(id);
      return res.data || null;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignment/create',
  async (formData: AssignmentFormData, { rejectWithValue }) => {
    try {
      const res = await assignmentApi.create(formData);
      return res.data!;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const regenerateAssignment = createAsyncThunk(
  'assignment/regenerate',
  async (id: string, { rejectWithValue }) => {
    try {
      await assignmentApi.regenerate(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignment/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await assignmentApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    setFormData: (state, action: PayloadAction<Partial<AssignmentFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setFormStep: (state, action: PayloadAction<1 | 2>) => {
      state.formStep = action.payload;
    },
    resetForm: (state) => {
      state.formData = initialFormData;
      state.formStep = 1;
    },
    setGenerationStatus: (
      state,
      action: PayloadAction<{
        status: AssignmentState['generationStatus'];
        progress?: number;
        message?: string;
        paperId?: string;
      }>
    ) => {
      state.generationStatus = action.payload.status;
      if (action.payload.progress !== undefined) {
        state.generationProgress = action.payload.progress;
      }
      if (action.payload.message !== undefined) {
        state.generationMessage = action.payload.message;
      }
    },
    resetGenerationStatus: (state) => {
      state.generationStatus = 'idle';
      state.generationProgress = 0;
      state.generationMessage = '';
    },
    updateAssignmentStatus: (
      state,
      action: PayloadAction<{ id: string; status: Assignment['status'] }>
    ) => {
      const idx = state.assignments.findIndex((a) => a._id === action.payload.id);
      if (idx !== -1) {
        state.assignments[idx].status = action.payload.status;
      }
      if (state.currentAssignment?._id === action.payload.id) {
        state.currentAssignment.status = action.payload.status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload.data || [];
        state.totalPages = action.payload.pagination?.pages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchAssignment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload;
        if (action.payload) {
          state.generationStatus = action.payload.status;
          if (action.payload.status === 'completed') {
            state.generationProgress = 100;
            state.generationMessage = 'Question paper generated successfully!';
          } else if (action.payload.status === 'failed') {
            state.generationProgress = 0;
            state.generationMessage = action.payload.errorMessage || 'Generation failed';
          } else if (action.payload.status === 'processing') {
            if (state.generationProgress < 20) {
              state.generationProgress = 20;
              state.generationMessage = 'AI is generating your question paper...';
            }
          } else if (action.payload.status === 'pending') {
            if (state.generationProgress < 5) {
              state.generationProgress = 5;
              state.generationMessage = 'Assignment created, queuing AI job...';
            }
          }
        }
      })
      .addCase(fetchAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchPaper.pending, (state) => {
        state.papersLoading = true;
      })
      .addCase(fetchPaper.fulfilled, (state, action) => {
        state.papersLoading = false;
        state.currentPaper = action.payload;
        if (action.payload) {
          state.generationStatus = 'completed';
          state.generationProgress = 100;
          state.generationMessage = 'Question paper generated successfully!';
        }
      })
      .addCase(fetchPaper.rejected, (state, action) => {
        state.papersLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.generationStatus = 'pending';
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload;
        state.assignments.unshift(action.payload);
        state.generationStatus = 'pending';
        state.generationProgress = 5;
        state.generationMessage = 'Assignment created, queuing AI job...';
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.generationStatus = 'failed';
      });

    builder.addCase(regenerateAssignment.fulfilled, (state, action) => {
      state.generationStatus = 'pending';
      state.generationProgress = 0;
      state.currentPaper = null;
      state.generationMessage = 'Regeneration started...';
      const idx = state.assignments.findIndex((a) => a._id === action.payload);
      if (idx !== -1) state.assignments[idx].status = 'pending';
    });

    builder.addCase(deleteAssignment.fulfilled, (state, action) => {
      state.assignments = state.assignments.filter((a) => a._id !== action.payload);
      if (state.currentAssignment?._id === action.payload) {
        state.currentAssignment = null;
      }
    });
  },
});

export const {
  setFormData,
  setFormStep,
  resetForm,
  setGenerationStatus,
  resetGenerationStatus,
  updateAssignmentStatus,
  clearError,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
