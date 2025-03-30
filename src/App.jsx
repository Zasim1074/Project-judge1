import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomeScreen } from "./screens/HomeScreen";
import { PlaygroundScreen } from "./screens/PlaygroundScreen";
import { PlaygroundProvider } from "./Providers/PlaygroundProviders";
import { ModalProvider } from "./Providers/ModalProvider";

export default function App() {
  return (
    <>
      <PlaygroundProvider>
        <ModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/playground/:fileId/:folderId" element={<PlaygroundScreen />} />
            </Routes>
          </BrowserRouter>
        </ModalProvider>
      </PlaygroundProvider>
    </>
  );
};