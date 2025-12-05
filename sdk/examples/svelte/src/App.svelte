<script>
  import { Router, Route } from 'svelte-routing'
  import Home from './views/Home.svelte'
  import About from './views/About.svelte'
  import ErrorTest from './views/ErrorTest.svelte'
  import Performance from './views/Performance.svelte'
  import NavBar from './components/NavBar.svelte'
</script>

<Router>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/error-test" component={ErrorTest} />
      <Route path="/performance" component={Performance} />
    </main>
  </div>
</Router>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #f5f5f5;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }


  .main-content {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
  }
</style>

