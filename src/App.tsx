import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { SeatsPage } from './pages/SeatsPage'
import { SessionsPage } from './pages/SessionsPage'
import { MotionsPage } from './pages/MotionsPage'
import { VotingPage } from './pages/VotingPage'
import { TimePage } from './pages/TimePage'
import { EventsPage } from './pages/EventsPage'
import { FilesPage } from './pages/FilesPage'
import { SettingsPage } from './pages/SettingsPage'
import { useRoute } from './router'

export default function App() {
  const route = useRoute()

  let page = <HomePage />
  if (route === '/seats') page = <SeatsPage />
  else if (route === '/sessions') page = <SessionsPage />
  else if (route === '/motions') page = <MotionsPage />
  else if (route === '/voting') page = <VotingPage />
  else if (route === '/time') page = <TimePage />
  else if (route === '/events') page = <EventsPage />
  else if (route === '/files') page = <FilesPage />
  else if (route === '/settings') page = <SettingsPage />

  return <AppShell route={route}>{page}</AppShell>
}
