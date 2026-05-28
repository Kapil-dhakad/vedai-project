import { configureStore } from '@reduxjs/toolkit';
import assignmentReducer from './assignmentSlice';

export const store = configureStore({
  reducer: {
    assignment: assignmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['assignment.formData.file'],
        ignoredActions: ['assignment/setFormData'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
