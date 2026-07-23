import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  currentModule: 'dashboard'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setCurrentModule(state, action) {
      state.currentModule = action.payload;
    }
  }
});

export const { toggleSidebar, setSidebarOpen, toggleDarkMode, setCurrentModule } = uiSlice.actions;
export default uiSlice.reducer;
