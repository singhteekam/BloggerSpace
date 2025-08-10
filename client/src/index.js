import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { Provider } from "react-redux";
import { store } from "./redux/store";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const asyncLocalStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min fresh
      cacheTime: 30 * 60 * 1000, // keep in memory 30 min
      refetchOnWindowFocus: false, // avoid refetching on every tab focus
    },
  },
});

// Create localStorage persister
const persister = createAsyncStoragePersister({
  storage: asyncLocalStorage,
});

// Enable React Query cache persistence
persistQueryClient({
  queryClient,
  persister,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
