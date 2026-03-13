import {Routes,Route} from 'react-router';
import './App.css'

import { LoanPage } from './pages/LoanPage.jsx';
function App() {
  

  return (
    <Routes>
      <Route path="/loan" element={<LoanPage/>}/>
    </Routes>
  )
}

export default App
