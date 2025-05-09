import SmartSheet from './components/Sheet'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen w-full transition-colors duration-200 dark:bg-gray-900 flex flex-col">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--bg-toast, #fff)',
              color: 'var(--text-toast, #000)',
            },
            className: '!bg-white dark:!bg-gray-800 dark:!text-white'
          }}
        />
        <SmartSheet />
      </div>
    </ThemeProvider>
  )
}

export default App
